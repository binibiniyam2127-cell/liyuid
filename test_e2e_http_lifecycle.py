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

def authenticate_user(email: str, password: str = "SecurePass123!", phone_number: str = None) -> str:
    # 1. Register user with all required schema fields
    if not phone_number:
        rand_num = f"{uuid.uuid4().int % 900000000 + 100000000}"
        phone_number = f"+251{rand_num}"
    
    reg_payload = {
        "email": email,
        "password": password,
        "display_name": email.split("@")[0].title()[:20],
        "full_name": email.split("@")[0].title(),
        "phone_number": phone_number,
    }
    code, res = make_request("/auth/register", method="POST", data=reg_payload)
    assert code in (200, 201), f"User registration failed for {email}: {res}"

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

def run_e2e_test():
    print("==================================================================")
    print("   LIYUID BLIND-SIDED OWNERSHIP VERIFICATION & HANDOVER TEST      ")
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

    # 2a. Finder files Found report with private verification proof
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

    # 3. Privacy Test: Public Challenge Leak Check (FR-05)
    print(f"\n[*] 3. Testing GET /reports/{lost_id}/challenge...")
    code, chal_res = make_request(f"/reports/{lost_id}/challenge", method="GET")
    assert code == 200, f"Challenge query failed: {chal_res}"
    print(f"    [+] Question Exposed: {chal_res.get('challenge_question')}")
    assert "private_challenge_truth" not in chal_res, "CRITICAL: Private challenge truth leaked in public API!"
    assert "proof_primary_hash" not in chal_res, "CRITICAL: Proof primary hash leaked in public API!"
    assert "private_detail_encrypted" not in chal_res, "CRITICAL: Encrypted detail leaked in public API!"
    print("    [PASS] Verified blind privacy: zero secrets or ground truths exposed in public endpoint.")

    # 4. Lockout Protection: Incorrect Blind Guess Check (FR-05)
    print(f"\n[*] 4. Testing incorrect blind claim attempt via POST /reports/{lost_id}/verify-claim...")
    bad_attempt = {"challenge_attempt": "Wrong serial or random guess 12345"}
    code, bad_res = make_request(f"/reports/{lost_id}/verify-claim", method="POST", data=bad_attempt, token=owner_token)
    assert code == 200, f"Bad claim test unexpected code: {code} -> {bad_res}"
    assert bad_res.get("verified") is False, f"Expected verified=False for bad attempt: {bad_res}"
    remaining = bad_res.get("attempts_remaining")
    print(f"    [+] Response Status : {code}")
    print(f"    [+] Remaining tries : {remaining}")
    assert remaining == 2, f"Expected 2 attempts remaining, got {remaining}"
    print("    [PASS] Incorrect blind attempt rejected and attempts counter decremented.")

    # 5. Authentic Blind Claim Verification & Dynamic OTP Generation (FR-05 & FR-07)
    print(f"\n[*] 5. Submitting authentic blind ownership claim via POST /reports/{lost_id}/verify-claim...")
    good_attempt = {"challenge_attempt": ground_truth}
    code, good_res = make_request(f"/reports/{lost_id}/verify-claim", method="POST", data=good_attempt, token=owner_token)
    assert code == 200, f"Valid claim submission failed: {good_res}"
    assert good_res.get("verified") is True, f"Claim not verified: {good_res}"

    handover_code = good_res.get("one_time_handover_code")
    handover_id = good_res.get("handover_id")
    print(f"    [+] Blind Verification : PASS (verified=True)")
    print(f"    [+] Handover ID        : {handover_id}")
    print(f"    [+] Dynamic 6-Digit OTP: {handover_code}")
    assert handover_code and handover_id, "Handover code or handover_id was not returned!"
    assert len(str(handover_code)) == 6, f"Expected 6-digit OTP code, got: {handover_code}"
    print("    [PASS] Blind-sided verification succeeded and 6-digit release OTP minted.")

    # 6. Two-Party Physical Handover Confirmation (FR-09)
    print(f"\n[*] 6. Closing lifecycle via POST /handovers/{handover_id}/confirm...")

    # 6a. Finder inputs the 6-digit code received from Owner
    print("    [*] 6a. Finder enters 6-digit exchange code...")
    confirm_finder = {"finder_code": handover_code, "role": "finder"}
    code, f_conf_res = make_request(f"/handovers/{handover_id}/confirm", method="POST", data=confirm_finder, token=finder_token)
    assert code == 200, f"Finder confirmation failed: {f_conf_res}"
    assert f_conf_res.get("finder_confirmed") is True, f"Finder confirmation not recorded: {f_conf_res}"
    print(f"    [+] Finder Confirmed : Status {code} (Closed: {f_conf_res.get('is_fully_closed')})")

    # 6b. Owner confirms item receipt
    print("    [*] 6b. Owner confirms item receipt...")
    confirm_owner = {"handover_code": handover_code, "role": "owner"}
    code, o_conf_res = make_request(f"/handovers/{handover_id}/confirm", method="POST", data=confirm_owner, token=owner_token)
    assert code == 200, f"Owner confirmation failed: {o_conf_res}"
    assert o_conf_res.get("owner_confirmed") is True, f"Owner confirmation not recorded: {o_conf_res}"
    assert o_conf_res.get("is_fully_closed") is True, f"Handover was not marked fully closed: {o_conf_res}"
    assert o_conf_res.get("status") == "closed", f"Unexpected status: {o_conf_res.get('status')}"
    print(f"    [+] Owner Confirmed  : Status {code} (Closed: {o_conf_res.get('is_fully_closed')})")
    print("    [PASS] Dual-party confirmation closed successfully!")

    print("\n==================================================================")
    print(f"[*] BLIND-SIDED LIFECYCLE COMPLETED SUCCESSFULLY FOR ITEM: {lost_id}")
    print(f"[*] Verification passed without quiz / distractors (FR-01 to FR-10)")
    print("==================================================================")

if __name__ == "__main__":
    run_e2e_test()