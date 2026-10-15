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
    phone_number VARCHAR(32) UNIQUE NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    full_name VARCHAR(255),
    telegram_chat_id VARCHAR(64),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    telegram_state VARCHAR(32) DEFAULT 'not_connected' NOT NULL,
    telegram_link_code VARCHAR(64),
    telegram_link_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_chat_id);

-- 2. Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    category VARCHAR(64) NOT NULL,
    sub_city VARCHAR(64),
    brand VARCHAR(64),
    model VARCHAR(64),
    primary_color VARCHAR(32) NOT NULL,
    public_description TEXT NOT NULL,
    challenge_type VARCHAR(32) DEFAULT 'deterministic_proof',
    challenge_question TEXT,
    private_challenge_truth TEXT,
    proof_kind VARCHAR(32),
    proof_primary_hash VARCHAR(64),
    private_detail_encrypted BYTEA,
    location GEOMETRY(Point, 4326) NOT NULL,
    incident_timestamp TIMESTAMPTZ NOT NULL,
    date_from TIMESTAMPTZ,
    date_to TIMESTAMPTZ,
    text_embedding vector(384),
    sanitized_media_url TEXT,
    status VARCHAR(32) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_spatial ON items USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_items_blocking ON items(category, type, status);
CREATE INDEX IF NOT EXISTS idx_items_sub_city ON items(sub_city);
CREATE INDEX IF NOT EXISTS idx_items_proof_hash ON items(proof_primary_hash);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lost_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    found_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    claimant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    composite_score FLOAT NOT NULL,
    score_breakdown JSONB NOT NULL,
    verification_attempts INT DEFAULT 0 NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    photo_result VARCHAR(16) DEFAULT 'none' NOT NULL,
    proof_passed BOOLEAN DEFAULT FALSE NOT NULL,
    question_passed BOOLEAN DEFAULT FALSE NOT NULL,
    proof_attempts INT DEFAULT 0 NOT NULL,
    question_attempts INT DEFAULT 0 NOT NULL,
    cooldown_until TIMESTAMPTZ,
    lock_state VARCHAR(32) DEFAULT 'none' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_lost ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found ON matches(found_item_id);

-- 4. Handovers Table
CREATE TABLE IF NOT EXISTS handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    handover_code_hash VARCHAR(255) NOT NULL,
    owner_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    finder_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(32) DEFAULT 'open' NOT NULL,
    venue VARCHAR(32) DEFAULT 'direct',
    station_location VARCHAR(255),
    vault_locker VARCHAR(64),
    deposit_voucher VARCHAR(64),
    municipal_notes TEXT,
    regenerate_count INT DEFAULT 0 NOT NULL,
    code_attempts INT DEFAULT 0 NOT NULL,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Option Decoys Table
CREATE TABLE IF NOT EXISTS option_decoys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(64) NOT NULL,
    text VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_option_decoys_cat ON option_decoys(category);

-- 6. Finder Requests Table
CREATE TABLE IF NOT EXISTS finder_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'new' NOT NULL,
    next_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Staff Accounts Table
CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_code VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    staff_role VARCHAR(32) DEFAULT 'moderator' NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    totp_secret_encrypted BYTEA,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    failed_attempts INT DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    created_by VARCHAR(64) DEFAULT 'system_cli' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Flags Table
CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_entity VARCHAR(32) NOT NULL,
    entity_id UUID NOT NULL,
    flagged_by_id UUID,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending' NOT NULL,
    resolution_notes VARCHAR(1000),
    resolved_by_id UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flags_target ON flags(target_entity, entity_id);

-- 10. Audit Logs Table (FR-10)
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