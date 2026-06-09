"""One-shot: patch all espn_id fields into teams_config.py."""
import re
from pathlib import Path

ESPN_IDS = {
    "Mexico":                  203,
    "South Africa":            467,
    "South Korea":             451,
    "Czechia":                 450,
    "Canada":                  206,
    "Bosnia and Herzegovina":  452,
    "Qatar":                   4398,
    "Switzerland":             475,
    "Brazil":                  205,
    "Morocco":                 2869,
    "Haiti":                   2654,
    "Scotland":                580,
    "United States":           660,
    "Paraguay":                210,
    "Australia":               628,
    "Türkiye":                 465,
    "Germany":                 481,
    "Curaçao":                 11678,
    "Ivory Coast":             4789,
    "Ecuador":                 209,
    "Netherlands":             449,
    "Japan":                   627,
    "Sweden":                  466,
    "Tunisia":                 659,
    "Belgium":                 459,
    "Egypt":                   2620,
    "Iran":                    469,
    "New Zealand":             2666,
    "Spain":                   164,
    "Cape Verde":              2597,
    "Saudi Arabia":            655,
    "Uruguay":                 212,
    "France":                  478,
    "Senegal":                 654,
    "Norway":                  464,
    "Iraq":                    4375,
    "Argentina":               202,   # already set
    "Algeria":                 624,
    "Austria":                 474,
    "Jordan":                  2917,
    "Portugal":                482,
    "DR Congo":                2850,
    "Uzbekistan":              2570,
    "Colombia":                208,
    "England":                 448,
    "Croatia":                 477,
    "Ghana":                   4469,
    "Panama":                  2659,
}

path = Path("teams_config.py")
text = path.read_text(encoding="utf-8")

patched = 0
for country, eid in ESPN_IDS.items():
    # Match the block for this country and replace its espn_id field
    pattern = rf'("country":\s*"{re.escape(country)}".*?"espn_id":\s*)(?:None|\d+)'
    replacement = rf'\g<1>{eid}'
    new_text, n = re.subn(pattern, replacement, text, flags=re.DOTALL)
    if n:
        text = new_text
        patched += n

path.write_text(text, encoding="utf-8")
print(f"Patched {patched} espn_id fields")

# Verify
import importlib.util, sys
spec = importlib.util.spec_from_file_location("teams_config", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
missing = [t["country"] for t in mod.TEAMS if not t.get("espn_id")]
print(f"Teams still missing espn_id: {missing if missing else 'none'}")
print(f"Total teams with espn_id: {sum(1 for t in mod.TEAMS if t.get('espn_id'))}/48")
