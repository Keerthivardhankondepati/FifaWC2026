import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

tr = json.loads(Path("output/export/team_reviews.json").read_text(encoding="utf-8"))
spotlight = [t for t in tr if t["spotlight"]]

lines = []
for t in spotlight:
    squad = sorted(t["squad"], key=lambda p: p.get("market_value_eur") or 0, reverse=True)
    top3 = [(p["full_name"], p["position"], p.get("club",""), p.get("market_value_fmt","")) for p in squad[:3]]
    lines.append(f"{t['country']} | Group {t['group']} | {t['confederation']}")
    lines.append(f"  Manager: {t['manager']} | WC appearances: {t['wc_appearances']} | Best finish: {t['wc_best_finish']}")
    for name, pos, club, val in top3:
        lines.append(f"  - {name} ({pos}, {club}) {val}")
    lines.append("")

out = "\n".join(lines)
Path("output/export/spotlight_brief.txt").write_text(out, encoding="utf-8")
print(out)
