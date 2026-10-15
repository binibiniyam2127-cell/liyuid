import urllib.request
import json

req = urllib.request.Request(
    "https://api.github.com/repos/binibiniyam2127-cell/liyuid/actions/runs?per_page=6",
    headers={"User-Agent": "Python-Actions-Inspector"}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

print("=== RECENT GITHUB ACTIONS RUNS ===")
for r in data.get("workflow_runs", []):
    print(f"ID: {r['id']} | Name: {r['name']:<28} | Conclusion: {r['conclusion']:<8} | Commit: {r['head_commit']['id'][:7]} - {r['head_commit']['message'][:40]}")
    # Fetch jobs for this run
    jobs_url = r["jobs_url"]
    j_req = urllib.request.Request(jobs_url, headers={"User-Agent": "Python-Actions-Inspector"})
    with urllib.request.urlopen(j_req) as j_resp:
        j_data = json.loads(j_resp.read().decode())
        for j in j_data.get("jobs", []):
            print(f"   Job: {j['name']} ({j['conclusion']})")
            for step in j.get("steps", []):
                if step.get("conclusion") == "failure":
                    print(f"      FAILED STEP: {step['name']} ({step.get('conclusion')})")
