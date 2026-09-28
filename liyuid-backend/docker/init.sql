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

-- Items Table (Public + Private Segregated Fields)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type report_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    primary_color VARCHAR(30) NOT NULL,
    public_description TEXT NOT NULL,
    private_challenge_truth TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    incident_timestamp TIMESTAMPTZ NOT NULL,
    text_embedding vector(384),
    sanitized_media_url TEXT,
    status report_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast Spatial and Vector Indices
CREATE INDEX IF NOT EXISTS idx_items_spatial ON items USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_items_blocking ON items(category, type, status);

-- Matches Table
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