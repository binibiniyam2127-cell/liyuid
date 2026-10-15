import io
import uuid
from datetime import datetime, timedelta, timezone
import pytest

from app.models import Item, Match, Handover


def test_full_b3_b5_pipeline_lifecycle(client, normal_user, finder_user, user_auth_headers, finder_auth_headers):
    # 1. User identifiers and auth headers
    owner_headers = user_auth_headers
    finder_headers = finder_auth_headers

    now = datetime.now(timezone.utc)
    date_from = (now - timedelta(days=1)).isoformat()
    date_to = now.isoformat()

    # 2. User A (Owner) files Lost Report (Samsung Galaxy S23, Bole)
    lost_payload = {
        "type": "lost",
        "category": "electronics",
        "sub_city": "Bole",
        "brand": "Samsung",
        "model": "Galaxy S23",
        "primary_color": "Phantom Black",
        "public_description": "Lost near Medhanialem Mall around evening hours. Has dark protective bumper case.",
        "date_from": date_from,
        "date_to": date_to,
    }
    lost_res = client.post("/reports", json=lost_payload, headers=owner_headers)
    assert lost_res.status_code == 201
    lost_item = lost_res.json()
    lost_item_id = lost_item["id"]

    # 3. User B (Finder) files Found Report with private verification proof
    found_payload = {
        "type": "found",
        "category": "electronics",
        "sub_city": "Bole",
        "brand": "Samsung",
        "model": "Galaxy S23",
        "primary_color": "Phantom Black",
        "public_description": "Found a black smartphone near Medhanialem taxi rank.",
        "date_from": date_from,
        "date_to": date_to,
        "proof_kind": "imei",
        "proof_primary": "358921098765432",
        "private_detail": "Lock screen wallpaper has a golden retriever puppy.",
    }
    found_res = client.post("/reports", json=found_payload, headers=finder_headers)
    assert found_res.status_code == 201

    # 4. Search & Retrieve Matches for Owner (trigger synchronous match generation)
    find_res = client.post(f"/reports/{lost_item_id}/find-matches", headers=owner_headers)
    assert find_res.status_code == 200
    candidates = find_res.json()
    assert len(candidates) > 0

    top_match = candidates[0]
    match_id = top_match["match_id"]
    assert top_match["composite_score"] > 0.0

    # Verify report matches list endpoint
    matches_res = client.get(f"/reports/{lost_item_id}/matches", headers=owner_headers)
    assert matches_res.status_code == 200
    assert len(matches_res.json()) > 0

    # 5. Layer 1: Photo Verification (multipart upload)
    dummy_photo = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb" + b"\x00" * 40
    photo_res = client.post(
        f"/matches/{match_id}/verification/photo",
        files={"file": ("test_proof.jpg", io.BytesIO(dummy_photo), "image/jpeg")},
        headers=owner_headers,
    )
    assert photo_res.status_code == 200
    assert photo_res.json()["photo_result"] in ("strong", "possible")

    # 6. Layer 2: Proof Verification (Owner inputs IMEI)
    proof_res = client.post(
        f"/matches/{match_id}/verification/proof",
        json={"proof_attempt": "358921098765432"},
        headers=owner_headers,
    )
    assert proof_res.status_code == 200
    assert proof_res.json()["proof_passed"] is True

    # 7. Layer 3: Asymmetric Challenge Question (6 shuffled decoy options)
    q_res = client.get(f"/matches/{match_id}/verification/question", headers=owner_headers)
    assert q_res.status_code == 200
    options = q_res.json()["options"]
    assert len(options) >= 6

    # Select correct option containing the retriever
    correct_option = next(
        (opt for opt in options if "retriever" in opt["text"].lower() or "puppy" in opt["text"].lower()),
        options[0],
    )
    ans_res = client.post(
        f"/matches/{match_id}/verification/answer",
        json={"option_id": correct_option["id"]},
        headers=owner_headers,
    )
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert ans_data["question_passed"] is True
    assert ans_data["status"] == "passed"
    handover_id = ans_data["handover_id"]
    release_code = ans_data["one_time_code"]
    assert handover_id is not None
    assert release_code is not None
    assert len(release_code) == 6

    # 8. Physical Handover Protocol (Dual-Party Confirmation)
    # 8a: Finder inputs the 6-digit code received from Owner
    finder_confirm_res = client.post(
        f"/handovers/{handover_id}/confirm",
        json={"finder_code": release_code},
        headers=finder_headers,
    )
    assert finder_confirm_res.status_code == 200
    assert finder_confirm_res.json()["finder_confirmed"] is True

    # 8b: Owner confirms handover receipt
    owner_confirm_res = client.post(
        f"/handovers/{handover_id}/confirm",
        json={},
        headers=owner_headers,
    )
    assert owner_confirm_res.status_code == 200
    final_handover = owner_confirm_res.json()
    assert final_handover["owner_confirmed"] is True
    assert final_handover["status"] == "closed"
    assert final_handover["completed_at"] is not None