import json
from pathlib import Path

report = json.loads(Path("output/espn_verify/report.json").read_text(encoding="utf-8"))

total = len(report)
clean = sum(1 for r in report if not r["only_espn"] and not r["only_stage4"] and not r["field_diffs"])
has_espn_only = [(r["country"], r["only_espn"]) for r in report if r["only_espn"]]
has_s4_only   = [(r["country"], r["only_stage4"]) for r in report if r["only_stage4"]]
has_diffs     = [(r["country"], r["field_diffs"]) for r in report if r["field_diffs"]]

lines = [
    f"Teams processed: {total}/48",
    f"Clean (no differences): {clean}",
    f"Teams with ESPN-only players: {len(has_espn_only)}",
    f"Teams with stage4-only players: {len(has_s4_only)}",
    f"Teams with field diffs: {len(has_diffs)}",
    "",
    "=== PLAYERS ONLY IN ESPN (not in our stage4 data) ===",
]
for country, names in has_espn_only:
    for n in names:
        lines.append(f"  [{country}] {n}")

lines += ["", "=== PLAYERS ONLY IN STAGE4 (not found in ESPN squad) ==="]
for country, names in has_s4_only:
    for n in names:
        lines.append(f"  [{country}] {n}")

lines += ["", "=== FIELD DIFFERENCES (position or squad number) ==="]
for country, diffs in has_diffs:
    for d in diffs:
        for field, vals in d["diffs"].items():
            lines.append(f"  [{country}] {d['stage4_name']}: {field} ESPN={vals['espn']} stage4={vals['stage4']}")

out = "\n".join(lines)
Path("output/espn_verify/summary.txt").write_text(out, encoding="utf-8")
print(out)
