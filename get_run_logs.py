import urllib.request
import json

def get_job_info(run_id):
    url = f"https://api.github.com/repos/binibiniyam2127-cell/liyuid/actions/runs/{run_id}/jobs"
    req = urllib.request.Request(url, headers={"User-Agent": "Actions-Checker"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    for job in data.get("jobs", []):
        job_id = job["id"]
        print(f"\n=== Run {run_id} | Job: {job['name']} (ID: {job_id}) ({job['conclusion']}) ===")
        for step in job.get("steps", []):
            status = step.get("conclusion") or step.get("status")
            print(f"  Step #{step['number']}: {step['name']} -> {status}")
            
        # Try fetching log
        try:
            log_url = f"https://api.github.com/repos/binibiniyam2127-cell/liyuid/actions/jobs/{job_id}/logs"
            l_req = urllib.request.Request(log_url, headers={"User-Agent": "Actions-Checker"})
            with urllib.request.urlopen(l_req) as l_resp:
                log_text = l_resp.read().decode("utf-8", errors="replace")
                print("\n--- JOB LOG TAIL (Last 40 lines) ---")
                print("\n".join(log_text.splitlines()[-40:]))
        except Exception as e:
            print(f"  Could not fetch job logs: {e}")

print("Checking Run 38565302794 (E2E Suite):")
get_job_info(38565302794)

print("\nChecking Run 38565302727 (CI Suite):")
get_job_info(38565302727)
