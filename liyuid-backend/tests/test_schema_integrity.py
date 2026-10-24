"""Tests for Database Schema Integrity, Constraints, and Alembic Configuration."""

import pytest
from sqlalchemy import UniqueConstraint, ForeignKeyConstraint
from alembic.config import Config
from alembic.script import ScriptDirectory

from app.database import Base
import app.models  # Ensure all models are loaded


def test_models_registered_in_metadata():
    """Ensure all core domain models are registered in Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    expected_tables = {
        "users",
        "items",
        "matches",
        "handovers",
        "chat_messages",
        "staff_accounts",
        "flags",
        "finder_requests",
        "audit_logs",
        "option_decoys",
    }
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"


def test_unique_constraints_and_indexes():
    """Ensure unique constraints are properly defined for identity & relationships."""
    users_table = Base.metadata.tables["users"]
    assert users_table.columns["email"].unique is True or any(
        idx.unique and "email" in [c.name for c in idx.columns] for idx in users_table.indexes
    )
    assert users_table.columns["phone_number"].unique is True or any(
        idx.unique and "phone_number" in [c.name for c in idx.columns] for idx in users_table.indexes
    )

    # Match lost-found pair uniqueness constraint
    matches_table = Base.metadata.tables["matches"]
    unique_constraints = [
        c for c in matches_table.constraints if isinstance(c, UniqueConstraint)
    ]
    uq_names = [c.name for c in unique_constraints]
    assert "uq_match_lost_found" in uq_names, "Missing uq_match_lost_found constraint on matches"

    # Handover match uniqueness
    handovers_table = Base.metadata.tables["handovers"]
    assert handovers_table.columns["match_id"].unique is True


def test_foreign_key_relationships():
    """Ensure cascade and foreign keys exist across models."""
    items_table = Base.metadata.tables["items"]
    user_fks = [fk for fk in items_table.foreign_keys if fk.column.table.name == "users"]
    assert len(user_fks) > 0
    assert user_fks[0].ondelete == "CASCADE"

    handovers_table = Base.metadata.tables["handovers"]
    match_fks = [fk for fk in handovers_table.foreign_keys if fk.column.table.name == "matches"]
    assert len(match_fks) > 0
    assert match_fks[0].ondelete == "CASCADE"


def test_alembic_scripts_directory():
    """Ensure Alembic script directory is readable and points to the baseline head."""
    import os
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ini_path = os.path.join(backend_dir, "alembic.ini")
    
    cfg = Config(ini_path)
    cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    
    script = ScriptDirectory.from_config(cfg)
    heads = script.get_heads()
    assert len(heads) == 1
    assert heads[0] == "0db7b3778fde"

