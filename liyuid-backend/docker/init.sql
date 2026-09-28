CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

DO $$ BEGIN
    CREATE TYPE report_type AS ENUM ('lost', 'found');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('active', 'matched', 'verifying', 'handover_pending', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(32) UNIQUE,
    telegram_chat_id VARCHAR(64),
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type report_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    primary_color VARCHAR(30) NOT NULL,
    public_description TEXT NOT NULL,
    challenge_type VARCHAR(100),
    challenge_question TEXT,
    private_challenge_truth TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    incident_timestamp TIMESTAMPTZ NOT NULL,
    text_embedding vector(384),
    sanitized_media_url TEXT,
    status report_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_spatial ON items USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_items_blocking ON items(category, type, status);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lost_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    found_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    composite_score FLOAT NOT NULL,
    score_breakdown JSONB NOT NULL,
    verification_attempts INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Handovers Table
CREATE TABLE IF NOT EXISTS handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    handover_code_hash VARCHAR(255) NOT NULL,
    owner_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    finder_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 5. Audit Logs Table (FR-10)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(32) NOT NULL,
    entity_id UUID NOT NULL,
    actor_id UUID,
    action VARCHAR(64) NOT NULL,
    severity VARCHAR(16) DEFAULT 'info' NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);