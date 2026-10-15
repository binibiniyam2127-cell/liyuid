# tests/test_b8_privacy_and_rules.py
import pytest
from app import schemas

FORBIDDEN_FIELDS = {
    "phone_number",
    "email",
    "full_name",
    "private_challenge_truth",
    "proof_primary_hash",
    "private_detail_encrypted",
    "location",
    "latitude",
    "longitude",
    "lat",
    "lon",
}

PUBLIC_MODELS = [
    schemas.ItemResponse,
    schemas.MatchItemDetail,
    schemas.VerificationStateResponse,
    schemas.PhotoVerificationResponse,
    schemas.ProofVerificationResponse,
    schemas.QuestionResponse,
    schemas.AnswerVerificationResponse,
    schemas.HandoverResponse,
    schemas.ChatMessageResponse,
    schemas.FinderRequestResponse,
    schemas.UserSettingsResponse,
]


def test_public_models_contain_no_pii():
    for model in PUBLIC_MODELS:
        fields = set(model.model_fields.keys())
        leakage = fields.intersection(FORBIDDEN_FIELDS)
        assert not leakage, f"Privacy Violation: Schema {model.__name__} exposes forbidden fields: {leakage}"


def test_match_item_detail_only_exposes_display_name():
    assert "finder_display_name" in schemas.MatchItemDetail.model_fields
    assert "full_name" not in schemas.MatchItemDetail.model_fields
    assert "phone_number" not in schemas.MatchItemDetail.model_fields


def test_chat_payload_rejects_ethiopian_phone():
    with pytest.raises(ValueError):
        schemas.ChatMessagePayload(text="Call me at +251911223344")

    with pytest.raises(ValueError):
        schemas.ChatMessagePayload(text="My number is 0911223344")

    with pytest.raises(ValueError):
        schemas.ChatMessagePayload(text="Reach me at test@example.com")