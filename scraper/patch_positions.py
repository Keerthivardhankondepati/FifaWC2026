"""
Apply ESPN position corrections to stage4 JSON files.

Rules:
- Apply all position diffs from espn_verify/report.json
- SKIP: Lee Gi-hyuk (South Korea) - ESPN has DF but he's a winger
- SKIP: Éderson Silva (Brazil) - ESPN matched wrong player (GK vs MF)
- SKIP: Ronald Araújo (Uruguay) - ESPN has MF but he's a CB
- Remove: Lutsharel Geertruida (Netherlands) - injured, not in ESPN squad
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUTPUT = Path(__file__).parent / "output"
REPORT = OUTPUT / "espn_verify" / "report.json"

SKIP = {
    ("South Korea", "Lee Gi-hyuk"),
    ("Brazil", "Éderson Silva"),
    ("Uruguay", "Ronald Araújo"),
}

REMOVE = {
    ("Netherlands", "Lutsharel Geertruida"),
}

report = json.loads(REPORT.read_text(encoding="utf-8"))

total_pos_changes = 0
total_removals = 0

for team_result in report:
    country = team_result["country"]
    slug = None

    # Find slug from the filename
    stage4_files = list(OUTPUT.glob("*_stage4.json"))
    team_file = None
    for f in stage4_files:
        data = json.loads(f.read_text(encoding="utf-8"))
        if data.get("country") == country:
            team_file = f
            break

    if not team_file:
        print(f"[{country}] stage4 file not found — skipping")
        continue

    data = json.loads(team_file.read_text(encoding="utf-8"))
    squad = data["squad"]
    changed = False

    # Apply position fixes
    for diff in team_result["field_diffs"]:
        s4_name = diff["stage4_name"]
        if "position" not in diff["diffs"]:
            continue
        if (country, s4_name) in SKIP:
            print(f"  SKIP [{country}] {s4_name} (manual override)")
            continue

        espn_pos = diff["diffs"]["position"]["espn"]
        for player in squad:
            if player["full_name"] == s4_name:
                old = player.get("position")
                player["position"] = espn_pos
                print(f"  [{country}] {s4_name}: {old} -> {espn_pos}")
                total_pos_changes += 1
                changed = True
                break
        else:
            # Name might have (captain) suffix appended by ESPN
            base = s4_name.replace("(captain)", "").strip()
            for player in squad:
                if player["full_name"] == base:
                    old = player.get("position")
                    player["position"] = espn_pos
                    print(f"  [{country}] {base}: {old} -> {espn_pos}")
                    total_pos_changes += 1
                    changed = True
                    break

    # Remove injured players
    for (rc, rn) in REMOVE:
        if rc != country:
            continue
        before = len(squad)
        squad = [p for p in squad if p["full_name"] != rn]
        if len(squad) < before:
            print(f"  REMOVE [{country}] {rn}")
            total_removals += 1
            changed = True

    if changed:
        data["squad"] = squad
        team_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  -> saved {team_file.name}")

print(f"\nDone: {total_pos_changes} position changes, {total_removals} removals")
