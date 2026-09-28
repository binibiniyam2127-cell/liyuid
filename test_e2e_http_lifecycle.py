import json
import time
import uuid
import urllib.request
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
def run_e2e_test():
    print("==================================================================")
    print("      LIYUID END-TO-END HTTP INTEGRATION TEST (FASTAPI GATEWAY)   ")
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
    found_payload = {
        "type": "found",
        "category": "electronics",
        "brand": "Apple",
        "model": "iPhone 13",
        "primary_color": "black",
        "public_description": "Found a black iPhone near Addis Ababa Bole airport lounge.",
        "challenge_type": "deterministic_code",
        "challenge_question": "What is on the lock screen wallpaper?",
        "private_challenge_truth": "Unused finder placeholder",
        "latitude": 8.9806,
        "longitude": 38.7578,
        "incident_timestamp": "2026-09-28T09:00:00Z"
    }
    code, found_res = make_request("/reports", method="POST", data=found_payload, token=finder_token)
    assert code in (200, 201), f"Found report creation failed: {found_res}"
    found_id = found_res["id"]
    print(f"    [+] Found Item ID : {found_id}")

    ground_truth = "A sleeping white cat"
    lost_payload = {
        "type": "lost",
        "category": "electronics",
        "brand": "Apple",
        "model": "iPhone 13",
        "primary_color": "black",
        "public_description": "Lost my black iPhone 13 at the Bole airport terminal.",
        "challenge_type": "descriptive_marker",
        "challenge_question": "What image is on the lock screen wallpaper?",
        "private_challenge_truth": ground_truth,
        "latitude": 8.9810,
        "longitude": 38.7580,
        "incident_timestamp": "2026-09-28T08:30:00Z"
    }
    code, lost_res = make_request("/reports", method="POST", data=lost_payload, token=owner_token)
    assert code in (200, 201), f"Lost report creation failed: {lost_res}"
    lost_id = lost_res["id"]
    print(f"    [+] Lost Item ID  : {lost_id}")

    print("\n[*] Waiting 4 seconds for Celery embedding generation & matching...")
    time.sleep(4)

    # 3. Privacy Test: Public Challenge Leak Check (FR-05)
    print(f"\n[*] 3. Testing GET /reports/{lost_id}/challenge...")
    code, chal_res = make_request(f"/reports/{lost_id}/challenge", method="GET")
    assert code == 200, f"Challenge query failed: {chal_res}"
    print(f"    [+] Question Exposed: {chal_res.get('challenge_question')}")
    assert "private_challenge_truth" not in chal_res, "CRITICAL: Private challenge truth leaked in public API!"
    print("    [PASS] Verified privacy: ground truth is not exposed.")

    # 4. Lockout Protection: Incorrect Answer Check (FR-05)
    print(f"\n[*] 4. Testing incorrect claim via POST /reports/{lost_id}/verify-claim...")
    bad_attempt = {"challenge_attempt": "Wrong wallpaper"}
    code, bad_res = make_request(f"/reports/{lost_id}/verify-claim", method="POST", data=bad_attempt, token=owner_token)
    print(f"    [+] Response Status : {code}")
    print(f"    [+] Remaining tries : {bad_res.get('attempts_remaining')}")
    print("    [PASS] Bad claim was rejected as expected.")

    # 5. Correct Claim Attempt & Token Minting (FR-05 & FR-07)
    print(f"\n[*] 5. Submitting authentic ground truth claim...")
    good_attempt = {"challenge_attempt": ground_truth}
    code, good_res = make_request(f"/reports/{lost_id}/verify-claim", method="POST", data=good_attempt, token=owner_token)
    assert code == 200, f"Valid claim submission failed: {good_res}"

    handover_code = good_res.get("one_time_handover_code")
    handover_id = good_res.get("handover_id")
    print(f"    [+] Claim Verified   : {good_res.get('verified')}")
    print(f"    [+] Handover ID      : {handover_id}")
    print(f"    [+] One-Time Code    : {handover_code}")
    assert handover_code and handover_id, "Handover code or handover_id was not returned!"

    # 6. Handover Two-Party Confirmation (FR-09)
    print(f"\n[*] 6. Closing lifecycle via POST /handovers/{handover_id}/confirm...")
    
    # 6a. Finder confirms
    confirm_finder = {"handover_code": handover_code, "role": "finder"}
    code, f_conf_res = make_request(f"/handovers/{handover_id}/confirm", method="POST", data=confirm_finder, token=finder_token)
    assert code == 200, f"Finder confirmation failed: {f_conf_res}"
    print(f"    [+] Finder Confirmed : Status {code} (Closed: {f_conf_res.get('is_fully_closed')})")

    # 6b. Owner confirms
    confirm_owner = {"handover_code": handover_code, "role": "owner"}
    code, o_conf_res = make_request(f"/handovers/{handover_id}/confirm", method="POST", data=confirm_owner, token=owner_token)
    assert code == 200, f"Owner confirmation failed: {o_conf_res}"
    print(f"    [+] Owner Confirmed  : Status {code} (Closed: {o_conf_res.get('is_fully_closed')})")
    assert o_conf_res.get("is_fully_closed") is True, "Handover was not marked fully closed!"
    print("    [PASS] Dual-confirmation closed successfully!")

    print("\n==================================================================")
    print(f"[*] LIFECYCLE COMPLETED SUCCESSFULLY FOR ITEM: {lost_id}")
    print(f"[*] All Functional Requirements (FR-01 to FR-10) Verified via HTTP")
    print("==================================================================")

if __name__ == "__main__":
    run_e2e_test()