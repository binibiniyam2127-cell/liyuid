"""initial_schema_baseline

Revision ID: 0db7b3778fde
Revises: 
Create Date: 2026-10-24 17:03:03.735622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '0db7b3778fde'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable required PostgreSQL extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    op.execute('CREATE EXTENSION IF NOT EXISTS "postgis";')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector";')

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()
    if 'users' in existing_tables:
        # Schema already initialized by init.sql - baseline is present
        return

    # 2. Table: users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone_number', sa.String(32), nullable=False),
        sa.Column('display_name', sa.String(64), nullable=False),
        sa.Column('telegram_chat_id', sa.String(64), nullable=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(32), server_default='user', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('phone_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('email_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('telegram_state', sa.String(32), server_default='not_connected', nullable=False),
        sa.Column('telegram_link_code', sa.String(64), nullable=True),
        sa.Column('telegram_link_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_phone_number', 'users', ['phone_number'], unique=True)
    op.create_index('ix_users_telegram_chat_id', 'users', ['telegram_chat_id'])
    op.create_index('ix_users_telegram_link_code', 'users', ['telegram_link_code'])

    # 3. Table: items
    op.create_table(
        'items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(16), nullable=False),
        sa.Column('category', sa.String(64), nullable=False),
        sa.Column('sub_city', sa.String(64), nullable=True),
        sa.Column('brand', sa.String(64), nullable=True),
        sa.Column('model', sa.String(64), nullable=True),
        sa.Column('primary_color', sa.String(32), nullable=False),
        sa.Column('public_description', sa.Text(), nullable=False),
        sa.Column('challenge_type', sa.String(32), server_default='deterministic_proof', nullable=True),
        sa.Column('challenge_question', sa.Text(), nullable=True),
        sa.Column('private_challenge_truth', sa.Text(), nullable=True),
        sa.Column('proof_kind', sa.String(32), nullable=True),
        sa.Column('proof_primary_hash', sa.String(64), nullable=True),
        sa.Column('private_detail_encrypted', sa.LargeBinary(), nullable=True),
        sa.Column('location', Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('incident_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('date_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('text_embedding', Vector(384), nullable=True),
        sa.Column('status', sa.String(32), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_items_user_id', 'items', ['user_id'])
    op.create_index('ix_items_category', 'items', ['category'])
    op.create_index('ix_items_sub_city', 'items', ['sub_city'])
    op.create_index('ix_items_proof_primary_hash', 'items', ['proof_primary_hash'])
    op.create_index('ix_items_incident_timestamp', 'items', ['incident_timestamp'])
    op.create_index('ix_items_status', 'items', ['status'])

    # 4. Table: matches
    op.create_table(
        'matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('lost_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('found_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('items.id', ondelete='CASCADE'), nullable=False),
        sa.Column('claimant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('composite_score', sa.Float(), nullable=False),
        sa.Column('score_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('verification_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_locked', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('photo_result', sa.String(16), server_default='none', nullable=False),
        sa.Column('proof_passed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('question_passed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('proof_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('question_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('cooldown_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('lock_state', sa.String(32), server_default='none', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('lost_item_id', 'found_item_id', name='uq_match_lost_found'),
    )
    op.create_index('ix_matches_lost_item_id', 'matches', ['lost_item_id'])
    op.create_index('ix_matches_found_item_id', 'matches', ['found_item_id'])
    op.create_index('ix_matches_claimant_id', 'matches', ['claimant_id'])

    # 5. Table: handovers
    op.create_table(
        'handovers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('match_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('matches.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('handover_code_hash', sa.String(255), nullable=False),
        sa.Column('owner_confirmed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('finder_confirmed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('status', sa.String(32), server_default='open', nullable=False),
        sa.Column('venue', sa.String(32), server_default='direct', nullable=True),
        sa.Column('station_location', sa.String(255), nullable=True),
        sa.Column('vault_locker', sa.String(64), nullable=True),
        sa.Column('deposit_voucher', sa.String(64), nullable=True),
        sa.Column('municipal_notes', sa.Text(), nullable=True),
        sa.Column('regenerate_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('code_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 6. Table: chat_messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('match_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('matches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_chat_messages_match_id', 'chat_messages', ['match_id'])
    op.create_index('ix_chat_messages_sender_user_id', 'chat_messages', ['sender_user_id'])

    # 7. Table: staff_accounts
    op.create_table(
        'staff_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('staff_code', sa.String(32), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(128), nullable=False),
        sa.Column('staff_role', sa.String(32), server_default='moderator', nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('totp_secret_encrypted', sa.LargeBinary(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('failed_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(64), server_default='system_cli', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_staff_accounts_staff_code', 'staff_accounts', ['staff_code'], unique=True)
    op.create_index('ix_staff_accounts_email', 'staff_accounts', ['email'], unique=True)

    # 8. Table: flags
    op.create_table(
        'flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('target_entity', sa.String(32), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('flagged_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.String(500), nullable=False),
        sa.Column('status', sa.String(32), server_default='pending', nullable=False),
        sa.Column('resolution_notes', sa.String(1000), nullable=True),
        sa.Column('resolved_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_flags_entity_id', 'flags', ['entity_id'])

    # 9. Table: finder_requests
    op.create_table(
        'finder_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('match_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('matches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(32), server_default='new', nullable=False),
        sa.Column('next_reminder_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_finder_requests_match_id', 'finder_requests', ['match_id'])

    # 10. Table: audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('entity_type', sa.String(32), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('severity', sa.String(16), server_default='info', nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
    op.create_index('ix_audit_logs_actor_id', 'audit_logs', ['actor_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_severity', 'audit_logs', ['severity'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])

    # 11. Table: option_decoys
    op.create_table(
        'option_decoys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('category', sa.String(64), nullable=False),
        sa.Column('text', sa.String(255), nullable=False),
    )
    op.create_index('ix_option_decoys_category', 'option_decoys', ['category'])


def downgrade() -> None:
    op.drop_table('option_decoys')
    op.drop_table('audit_logs')
    op.drop_table('finder_requests')
    op.drop_table('flags')
    op.drop_table('staff_accounts')
    op.drop_table('chat_messages')
    op.drop_table('handovers')
    op.drop_table('matches')
    op.drop_table('items')
    op.drop_table('users')
