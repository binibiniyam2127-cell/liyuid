BEGIN;

-- 1. Create B2 ENUM Types
DO $$ BEGIN     CREATE TYPE telegram_state_enum AS ENUM ('not_connected', 'waiting', 'connected', 'expired'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     CREATE TYPE proof_kind_enum AS ENUM ('imei', 'id_last4', 'contents', 'keychain', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     CREATE TYPE photo_result_enum AS ENUM ('none', 'strong', 'possible', 'weak'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     CREATE TYPE match_lock_state_enum AS ENUM ('none', 'locked', 'review_requested', 'staff_allowed_retry'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     CREATE TYPE handover_status_enum AS ENUM ('open', 'closed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     CREATE TYPE finder_request_status_enum AS ENUM ('new', 'accepted', 'deferred'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create staff_accounts early so we can safely preserve admin accounts
CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    staff_role VARCHAR(32) NOT NULL DEFAULT 'moderator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Copy any existing admin users to staff_accounts
INSERT INTO staff_accounts (email, hashed_password, full_name, staff_role, is_active)
SELECT email, hashed_password, COALESCE(full_name, 'Admin User'), 'admin', is_active
FROM users
WHERE role = 'admin'
ON CONFLICT (email) DO NOTHING;

-- Normalize all remaining users in public table to 'user' role
UPDATE users SET role = 'user' WHERE role <> 'user' OR role IS NULL;

-- 3. Modify `users` Table
ALTER TABLE users
    ALTER COLUMN full_name DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS telegram_state telegram_state_enum NOT NULL DEFAULT 'not_connected',
    ADD COLUMN IF NOT EXISTS telegram_link_code VARCHAR(32) UNIQUE,
    ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMPTZ;

-- Deduplicate display_name for existing test rows
UPDATE users 
SET display_name = 'User_' || SUBSTRING(id::text, 1, 8)
WHERE display_name IS NULL 
   OR display_name = 'AnonymousUser'
   OR display_name IN (
       SELECT display_name FROM users GROUP BY display_name HAVING count(*) > 1
   );

ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

-- Standardize phone numbers to Ethiopian format (+251...)
UPDATE users
SET phone_number = '+251911' || LPAD((FLOOR(RANDOM() * 900000 + 100000))::text, 6, '0')
WHERE phone_number IS NULL OR phone_number !~ '^\+251[0-9]{9}$';  ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;  DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT uq_users_display_name UNIQUE (display_name);
EXCEPTION WHEN duplicate_table THEN null; WHEN duplicate_object THEN null;
END $$;  DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT ck_users_ethiopian_phone 
    CHECK (phone_number ~ '^\+251[0-9]{9}$'); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     ALTER TABLE users ADD CONSTRAINT ck_users_role_user_only      CHECK (role = 'user'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Modify `items` Table
ALTER TABLE items
    ALTER COLUMN private_challenge_truth DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS proof_kind proof_kind_enum,
    ADD COLUMN IF NOT EXISTS proof_primary_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS private_detail_encrypted BYTEA,
    ADD COLUMN IF NOT EXISTS sub_city VARCHAR(64) NOT NULL DEFAULT 'Bole',
    ADD COLUMN IF NOT EXISTS date_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS date_to TIMESTAMPTZ;

ALTER TABLE items DROP COLUMN IF EXISTS challenge_question;

-- Align existing items to satisfy check constraints
UPDATE items 
SET private_challenge_truth = NULL 
WHERE type = 'lost';

UPDATE items 
SET proof_kind = 'other' 
WHERE type = 'found' AND proof_kind IS NULL;

UPDATE items
SET category = 'other'
WHERE category NOT IN ('electronics', 'phones', 'documents', 'wallets', 'keys', 'bags', 'jewelry', 'other');

DO $$ BEGIN     ALTER TABLE items ADD CONSTRAINT ck_items_challenge_truth_by_type     CHECK (         (type = 'lost' AND private_challenge_truth IS NULL AND proof_kind IS NULL AND proof_primary_hash IS NULL AND private_detail_encrypted IS NULL)         OR         (type = 'found' AND proof_kind IS NOT NULL)     ); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     ALTER TABLE items ADD CONSTRAINT ck_items_sub_city     CHECK (sub_city IN (         'Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele',         'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka', 'Lemi Kura'     )); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN     ALTER TABLE items ADD CONSTRAINT ck_items_category     CHECK (category IN (         'electronics', 'phones', 'documents', 'wallets', 'keys', 'bags', 'jewelry', 'other'     )); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Modify `matches` Table
ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS photo_result photo_result_enum NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS proof_passed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS question_passed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lock_state match_lock_state_enum NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS cooldown_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS proof_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS question_attempts INT NOT NULL DEFAULT 0;

-- 6. Modify `handovers` Table
ALTER TABLE handovers
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS code_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status handover_status_enum NOT NULL DEFAULT 'open';

-- 7. Create Interaction Tables
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON chat_messages(match_id, created_at);

CREATE TABLE IF NOT EXISTS finder_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
    status finder_request_status_enum NOT NULL DEFAULT 'new',
    next_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_finder_requests_status_remind ON finder_requests(status, next_reminder_at);

CREATE TABLE IF NOT EXISTS option_decoys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(64) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS idx_option_decoys_category ON option_decoys(category);

CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_entity VARCHAR(32) NOT NULL,
    entity_id UUID NOT NULL,
    flagged_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    resolved_by_id UUID REFERENCES staff_accounts(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_flags_entity ON flags(target_entity, entity_id);

COMMIT;
