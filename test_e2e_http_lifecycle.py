import json
import time
import uuid
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://localhost:8000"

def make_request(path: str, method: str = "GET", data: dict = None, token: str = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            resp_body = resp.read().decode("utf-8")
            return status_code, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8")
        try:
            return exc.code, json.loads(err_body)
        except Exception:
            return exc.code, {"error": err_body}

def authenticate_user(email: str, password: str = "SecurePass123!") -> str:
    # 1. Register user
    reg_payload = {"email": email, "password": password, "full_name": email.split("@")[0].title()}
    make_request("/auth/register", method="POST", data=reg_payload)

    # 2. Request OAuth2 password bearer token directly using form-urlencoded body
    url = f"{BASE_URL}/auth/token"
    form_data = urllib.parse.urlencode({
        "username": email,
        "password": password
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res["access_token"]
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Failed to authenticate {email}: HTTP {e.code} - {body}")
    except Exception as e:
        raise RuntimeError(f"Failed to authenticate {email}: {e}")
def make_multipart_request(path: str, file_bytes: bytes, filename: str = "proof.jpg", token: str = None) -> tuple[int, dict]:
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex[:16]}"
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(err_body)
        except Exception:
            return exc.code, {"error": err_body}


def run_e2e_test():
    print("==================================================================")
    print("      LIYUID 4-LAYER CRYPTOGRAPHIC OWNERSHIP VERIFICATION TEST    ")
    print("==================================================================")

    run_id = uuid.uuid4().hex[:6]
    finder_email = f"finder_{run_id}@liyuid.com"
    owner_email = f"owner_{run_id}@liyuid.com"

    # 1. User Registration & Authentication
    print("[*] 1. Authenticating test users...")
    finder_token = authenticate_user(finder_email)
    owner_token = authenticate_user(owner_email)
    print(f"    [+] Finder JWT: {finder_token[:15]}...")
    print(f"    [+] Owner JWT : {owner_token[:15]}...")

    # 2. Ingest Reports (Found & Lost)
    print("\n[*] 2. Submitting Item Reports via POST /reports...")
    ground_truth = "Lock screen has a sleeping golden retriever"
    imei_proof = "358921098765432"
    now_iso = "2026-09-28T09:00:00Z"
    later_iso = "2026-09-28T18:00:00Z"

    # 2a. Finder files Found report with IMEI and private detail
    found_payload = {
        "type": "found",
        "category": "electronics",
        "sub_city": "Bole",
        "brand": "Samsung",
        "model": "Galaxy S23",
        "primary_color": "black",
        "public_description": "Found a black Samsung smartphone near Medhanialem taxi rank.",
        "date_from": now_iso,
        "date_to": later_iso,
        "proof_kind": "imei",
        "proof_primary": imei_proof,
        "private_detail": ground_truth,
    }
    code, found_res = make_request("/reports", method="POST", data=found_payload, token=finder_token)
    assert code in (200, 201), f"Found report creation failed: {found_res}"
    found_id = found_res["id"]
    print(f"    [+] Found Item ID : {found_id}")

    # 2b. Owner files Lost report
    lost_payload = {
        "type": "lost",
        "category": "electronics",
        "sub_city": "Bole",
        "brand": "Samsung",
        "model": "Galaxy S23",
        "primary_color": "black",
        "public_description": "Lost near Medhanialem Mall around evening hours. Has dark protective bumper case.",
        "date_from": now_iso,
        "date_to": later_iso,
    }
    code, lost_res = make_request("/reports", method="POST", data=lost_payload, token=owner_token)
    assert code in (200, 201), f"Lost report creation failed: {lost_res}"
    lost_id = lost_res["id"]
    print(f"    [+] Lost Item ID  : {lost_id}")

    # 3. Two-Stage Candidate Search & Match Retrieval
    print("\n[*] 3. Searching candidate matches via POST /reports/{lost_id}/find-matches...")
    find_code, candidates = make_request(f"/reports/{lost_id}/find-matches", method="POST", token=owner_token)
    assert find_code == 200, f"Find-matches failed: {candidates}"
    assert len(candidates) > 0, f"No candidate matches found for {lost_id}"

    top_match = candidates[0]
    match_id = top_match["match_id"]
    print(f"    [+] Candidate Match ID : {match_id}")
    print(f"    [+] Composite Score    : {top_match.get('composite_score')}")
    print(f"    [+] Explainable Tags   : {top_match.get('explainable_tags')}")

    # 4. Layer 1: Photo Similarity Inspection (Blind Visual Verification)
    print("\n[*] 4. [LAYER 1] Submitting Photo Similarity Inspection...")
    dummy_photo_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb" + b"\x00" * 32
    photo_code, photo_res = make_multipart_request(
        f"/matches/{match_id}/verification/photo",
        file_bytes=dummy_photo_bytes,
        filename="proof_photo.jpg",
        token=owner_token,
    )
    assert photo_code == 200, f"Photo verification failed: {photo_res}"
    photo_result = photo_res.get("photo_result")
    print(f"    [+] Photo Result   : {photo_result}")
    assert photo_result in ("strong", "possible"), f"Unexpected photo result: {photo_result}"
    print("    [PASS] Layer 1: Photo similarity inspection passed.")

    # 5. Layer 2: Deterministic Primary Proof (Hashed IMEI / Serial Number)
    print("\n[*] 5. [LAYER 2] Testing Deterministic Primary Proof...")
    # 5a: Test lockout resistance with wrong IMEI attempt
    bad_proof_attempt = {"proof_attempt": "999999999999999"}
    bad_code, bad_proof_res = make_request(
        f"/matches/{match_id}/verification/proof",
        method="POST",
        data=bad_proof_attempt,
        token=owner_token,
    )
    assert bad_code == 200, f"Bad proof request failed: {bad_proof_res}"
    assert bad_proof_res.get("proof_passed") is False
    print(f"    [+] Incorrect Proof Attempt Rejected as Expected (Tries remaining: {bad_proof_res.get('proof_attempts_remaining')})")

    # 5b: Submit authentic IMEI
    good_proof_attempt = {"proof_attempt": imei_proof}
    proof_code, proof_res = make_request(
        f"/matches/{match_id}/verification/proof",
        method="POST",
        data=good_proof_attempt,
        token=owner_token,
    )
    assert proof_code == 200, f"Valid proof submission failed: {proof_res}"
    assert proof_res.get("proof_passed") is True, f"Proof did not pass: {proof_res}"
    print("    [+] Authentic IMEI Verified: 358921098765432")
    print("    [PASS] Layer 2: Deterministic primary proof passed.")

    # 6. Layer 3: Decoy Trait Challenges (Machine-Generated Quiz with Distractors)
    print("\n[*] 6. [LAYER 3] Fetching Decoy Trait Challenge (Multi-Choice Quiz)...")
    q_code, q_res = make_request(
        f"/matches/{match_id}/verification/question",
        method="GET",
        token=owner_token,
    )
    assert q_code == 200, f"Failed to retrieve decoy challenge: {q_res}"
    options = q_res.get("options", [])
    print(f"    [+] Received {len(options)} shuffled options with random distractors:")
    for idx, opt in enumerate(options, 1):
        print(f"        {idx}. [ID: {opt['id'][:8]}...] {opt['text']}")
    assert len(options) >= 6, f"Expected at least 6 decoy options, got {len(options)}"

    # Identify correct quiz option matching ground truth
    correct_option = next(
        (opt for opt in options if "retriever" in opt["text"].lower() or "sleeping" in opt["text"].lower()),
        None,
    )
    assert correct_option is not None, "Ground truth option not found among challenge choices!"
    print(f"    [+] Selecting correct trait option: '{correct_option['text']}'")

    # Submit quiz answer
    ans_code, ans_res = make_request(
        f"/matches/{match_id}/verification/answer",
        method="POST",
        data={"option_id": correct_option["id"]},
        token=owner_token,
    )
    assert ans_code == 200, f"Quiz answer submission failed: {ans_res}"
    assert ans_res.get("question_passed") is True, f"Quiz was not passed: {ans_res}"
    release_code = ans_res.get("one_time_code")
    handover_id = ans_res.get("handover_id")
    print(f"    [+] Quiz Passed      : True")
    print(f"    [+] Handover ID      : {handover_id}")
    print(f"    [+] Dynamic OTP Code : {release_code}")
    assert release_code and len(release_code) == 6, f"Invalid 6-digit release code: {release_code}"
    print("    [PASS] Layer 3: Decoy trait challenge (quiz) passed.")

    # 7. Layer 4: Dynamic One-Time Password (OTP) Physical Handover Protocol
    print("\n[*] 7. [LAYER 4] Closing Handover via Dynamic OTP Dual-Confirmation Protocol...")

    # 7a. Finder submits the 6-digit code received from Owner
    print("    [*] 7a. Finder enters 6-digit exchange code...")
    finder_confirm = {"finder_code": release_code}
    f_code, f_res = make_request(
        f"/handovers/{handover_id}/confirm",
        method="POST",
        data=finder_confirm,
        token=finder_token,
    )
    assert f_code == 200, f"Finder handover confirmation failed: {f_res}"
    assert f_res.get("finder_confirmed") is True
    print(f"    [+] Finder Confirmation: Success (is_fully_closed: {f_res.get('is_fully_closed')})")

    # 7b. Owner confirms receipt
    print("    [*] 7b. Owner confirms item receipt...")
    owner_confirm = {}
    o_code, o_res = make_request(
        f"/handovers/{handover_id}/confirm",
        method="POST",
        data=owner_confirm,
        token=owner_token,
    )
    assert o_code == 200, f"Owner handover confirmation failed: {o_res}"
    assert o_res.get("owner_confirmed") is True
    assert o_res.get("is_fully_closed") is True, f"Handover was not marked fully closed: {o_res}"
    assert o_res.get("status") == "closed", f"Unexpected status: {o_res.get('status')}"
    print(f"    [+] Owner Confirmation : Success (is_fully_closed: True)")
    print("    [PASS] Layer 4: Dual-party dynamic OTP handover closed successfully!")

    print("\n==================================================================")
    print(f"[*] 4-LAYER VERIFICATION LIFECYCLE COMPLETED SUCCESSFULLY!")
    print(f"[*] Layer 1: Photo Similarity Inspection        -> [PASS]")
    print(f"[*] Layer 2: Deterministic Primary Proof (IMEI) -> [PASS]")
    print(f"[*] Layer 3: Decoy Trait Challenges (Quiz)      -> [PASS]")
    print(f"[*] Layer 4: Dynamic 6-Digit OTP Handover       -> [PASS]")
    print("==================================================================")


if __name__ == "__main__":
    run_e2e_test()