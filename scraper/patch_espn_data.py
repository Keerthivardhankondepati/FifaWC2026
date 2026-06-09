"""
Patch stage4 files with ESPN height/weight and espn_name aliases.

1. HEIGHT/WEIGHT: For every player matched in the ESPN report, copy
   ESPN's height and weight into the stage4 record.

2. ESPN_NAME ALIASES: Where the ESPN display name differs from our
   stage4 full_name (either via the matched pairs or via the known
   transliteration lookup below), store it as espn_name.
   Used by the website for search/lookup.
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUTPUT = Path(__file__).parent / "output"
REPORT = OUTPUT / "espn_verify" / "report.json"

# Manual alias pairs for names that failed fuzzy matching:
# (country, espn_name) -> stage4_full_name
ESPNNAME_TO_S4: dict[tuple[str, str], str] = {
    # Turkish chars: ı/ğ/ş stripped to nothing by normalizer
    ("Türkiye", "Altay Bayindir"):      "Altay Bayındır",
    ("Türkiye", "Ugurcan Çakir"):       "Uğurcan Çakır",
    ("Türkiye", "Ferdi Kadioglu"):      "Ferdi Kadıoğlu",
    ("Türkiye", "Kenan Yildiz"):        "Kenan Yıldız",
    ("Türkiye", "Baris Alper Yilmaz"):  "Barış Alper Yılmaz",
    ("Türkiye", "Oguz Aydin"):          "Oğuz Aydın",
    # Arabic transliteration differences
    ("Jordan", "Ehsan Haddad"):         "Ihsan Haddad(captain)",
    ("Jordan", "Mohammed Abu Zraiq"):   "Mohammad Abu Zrayq",
    ("Jordan", "Mousa Al-Tamari"):      "Musa Al-Taamari",
    ("Jordan", "Odeh Fakhoury"):        "Odeh Al-Fakhouri",
    ("Saudi Arabia", "Ala Al-Hajji"):   "Alaa Al-Hejji",
    ("Saudi Arabia", "Feras Al-Brikan"): "Firas Al-Buraikan",
    ("Iraq", "Munaf Younus"):           "Manaf Younis",
    # Name change (same player)
    ("Morocco", "Munir El Kajoui"):     "Munir Mohamedi",
    # Nickname vs full name
    ("Paraguay", "Alejandro Romero Gamarra"): "Kaku",
}

report = json.loads(REPORT.read_text(encoding="utf-8"))

hw_applied = 0
alias_applied = 0

for team_result in report:
    country = team_result["country"]

    # Find the stage4 file for this country
    team_file = None
    for f in OUTPUT.glob("*_stage4.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        if data.get("country") == country:
            team_file = f
            break
    if not team_file:
        continue

    data = json.loads(team_file.read_text(encoding="utf-8"))
    squad = data["squad"]
    s4_by_name = {p["full_name"]: p for p in squad}
    changed = False

    # 1. Height/weight + espn_name from matched players
    for match in team_result["players"]:
        s4_name  = match["stage4_name"]
        espn_name = match["espn_name"]
        height   = match.get("height")
        weight   = match.get("weight")

        player = s4_by_name.get(s4_name)
        if not player:
            continue

        if height and height != "--":
            player["height"] = height
            hw_applied += 1
            changed = True

        if weight and weight != "--":
            player["weight"] = weight
            changed = True

        if espn_name and espn_name != s4_name:
            player["espn_name"] = espn_name
            alias_applied += 1
            changed = True
            print(f"  alias [{country}] {s4_name!r} <- espn:{espn_name!r}")

    # 2. Manual alias lookup for transliteration failures
    for (c, en), s4n in ESPNNAME_TO_S4.items():
        if c != country:
            continue
        player = s4_by_name.get(s4n)
        if not player:
            print(f"  WARN [{country}] stage4 name not found: {s4n!r}")
            continue
        if player.get("espn_name") == en:
            continue  # already set
        player["espn_name"] = en
        alias_applied += 1
        changed = True
        print(f"  alias [{country}] {s4n!r} <- espn:{en!r}")

    if changed:
        team_file.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )

print(f"\nDone: {hw_applied} height/weight fields added, {alias_applied} espn_name aliases written")
