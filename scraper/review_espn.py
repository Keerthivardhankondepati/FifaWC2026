"""Review ESPN verification report in detail."""
import json
import sys
from pathlib import Path

# Force UTF-8 output so accented chars don't crash cp1252
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

report = json.loads(Path("output/espn_verify/report.json").read_text(encoding="utf-8"))

# --- Brazil Edersons ---
for r in report:
    if r["country"] == "Brazil":
        print("=== BRAZIL ===")
        print(f"ESPN:{r['espn_count']}  stage4:{r['stage4_count']}  matched:{r['matched']}")
        print("only_espn:", r["only_espn"])
        print("only_stage4:", r["only_stage4"])
        for p in r["players"]:
            en = p["espn_name"].lower()
            sn = p["stage4_name"].lower()
            if "derson" in en or "derson" in sn:
                print(f"  ESPN:{p['espn_name']} -> stage4:{p['stage4_name']}  score:{p['match_score']}  diffs:{p['diffs']}")
        break

# --- Egypt ---
for r in report:
    if r["country"] == "Egypt":
        print("\n=== EGYPT ===")
        print("only_espn:", r["only_espn"])
        print("only_stage4:", r["only_stage4"])
        break

# --- Uruguay ---
for r in report:
    if r["country"] == "Uruguay":
        print("\n=== URUGUAY ===")
        print("only_espn:", r["only_espn"])
        print("only_stage4:", r["only_stage4"])
        break

# --- Netherlands ---
for r in report:
    if r["country"] == "Netherlands":
        print("\n=== NETHERLANDS ===")
        print("only_espn:", r["only_espn"])
        print("only_stage4:", r["only_stage4"])
        break

# --- All position differences ---
print("\n\n=== ALL POSITION DIFFERENCES (ESPN vs stage4) ===")
for r in report:
    for d in r["field_diffs"]:
        if "position" in d["diffs"]:
            pos = d["diffs"]["position"]
            print(f"  [{r['country']}] {d['stage4_name']}: {pos['stage4']} -> {pos['espn']}")
