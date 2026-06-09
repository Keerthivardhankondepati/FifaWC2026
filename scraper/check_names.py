"""Check all player names and club fields for encoding issues."""
import json
import unicodedata
from pathlib import Path

output = Path("output")
issues = []
totals = {"teams": 0, "players": 0}

def has_issue(s: str) -> bool:
    if not s:
        return False
    for ch in s:
        cat = unicodedata.category(ch)
        # Surrogate chars (Cs) or private use (Co) indicate broken encoding
        if cat in ("Cs", "Co"):
            return True
        # Replacement character
        if ch == "�":
            return True
    return False

for f in sorted(output.glob("*_stage4.json")):
    data = json.loads(f.read_text(encoding="utf-8"))
    country = data.get("country", "")
    totals["teams"] += 1
    for p in data["squad"]:
        totals["players"] += 1
        for field in ("full_name", "club", "sofa_club", "club_tm"):
            val = p.get(field) or ""
            if has_issue(val):
                issues.append(f"[{country}] {p.get('full_name')} — {field}: {repr(val)}")

report = Path("name_check.txt")
lines = [
    f"Scanned {totals['teams']} teams, {totals['players']} players",
    f"Encoding issues: {len(issues)}",
    "",
] + issues
report.write_text("\n".join(lines), encoding="utf-8")

# Print summary (ascii-safe for PowerShell terminal)
print(f"Scanned {totals['teams']} teams, {totals['players']} players")
print(f"Encoding issues: {len(issues)}")
if issues:
    for i in issues[:20]:
        print(" ", i.encode("ascii", errors="replace").decode("ascii"))
