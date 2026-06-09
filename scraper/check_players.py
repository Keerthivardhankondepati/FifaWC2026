import json
from pathlib import Path

output = Path("output")

checks = [
    # (country_slug, name_fragment, expected_in_top, note)
    ("australia",    "nestory irankunda", False, "Watford = Championship"),
    ("australia",    "cristian volpato",  True,  "Sassuolo = Serie A"),
    ("australia",    "mohamed tour",      False, "Norwich City = Championship"),
    ("canada",       "ali ahmed",         False, "Norwich City = Championship"),
    ("panama",       "jose cordoba",      False, "Norwich City = Championship"),
    ("scotland",     "kenny mclean",      False, "Norwich City = Championship"),
    ("norway",       "egil selvik",       False, "Watford = Championship"),
    ("japan",        "ao tanaka",         True,  "Leeds United = Premier League"),
    ("sweden",       "gabriel gudm",      True,  "Leeds United = Premier League"),
    ("south-africa", "lyle foster",       True,  "Burnley = Premier League"),
    ("sweden",       "hjalmar ekdal",     True,  "Burnley = Premier League"),
    ("austria",      "david affengruber", False, "Elche = LaLiga 2"),
    ("algeria",      "luca zidane",       False, "Granada = LaLiga 2"),
    ("bosnia",       "hadzikad",          False, "Sampdoria = Serie B"),
    ("senegal",      "bamba dieng",       True,  "Lorient = Ligue 1"),
    ("switzerland",  "yvon mvogo",        True,  "Lorient = Ligue 1"),
    ("saudi-arabia", "al-hejji",          True,  "Neom SC = Saudi Pro League"),
    ("iraq",         "ali jasim",         True,  "Al-Najma = Saudi Pro League"),
]

print(f"{'Player':<30} {'expected':>8} {'actual':>8}  {'':4}  note")
print("-" * 95)
ok_count = 0
fail_count = 0
for slug, fragment, expected, note in checks:
    f = output / f"{slug}_stage4.json"
    if not f.exists():
        print(f"  [{slug}] file missing")
        continue
    data = json.loads(f.read_text(encoding="utf-8"))
    found = False
    for p in data["squad"]:
        name = p.get("full_name", "")
        if fragment.lower() in name.lower():
            actual = p.get("in_top_league")
            status = "OK  " if actual == expected else "FAIL"
            if actual == expected:
                ok_count += 1
            else:
                fail_count += 1
            print(f"  {name:<30} {str(expected):>8} {str(actual):>8}  {status}  {note}")
            found = True
            break
    if not found:
        print(f"  [{slug}] '{fragment}' not found")

print(f"\n{ok_count} passed, {fail_count} failed")
