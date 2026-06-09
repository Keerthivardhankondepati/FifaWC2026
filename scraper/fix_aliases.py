"""Fix specific wrong aliases and height/weight values introduced by patch_espn_data.py."""
import json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
OUTPUT = Path(__file__).parent / "output"

def load(slug):
    f = OUTPUT / f"{slug}_stage4.json"
    return f, json.loads(f.read_text(encoding="utf-8"))

def save(f, data):
    f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ── Netherlands ────────────────────────────────────────────────────────────────
# Wikipedia scraped "Quinten Timber" but ESPN has "Jurriën Timber" (the defender).
# Only one Timber in this squad; ESPN is authoritative → rename to Jurriën.
f, data = load("netherlands")
for p in data["squad"]:
    if p["full_name"] == "Quinten Timber":
        p["full_name"] = "Jurriën Timber"
        p.pop("espn_name", None)   # espn_name same as full_name now
        p["position"] = "DF"       # already set, belt+suspenders
        print("Netherlands: renamed Quinten Timber -> Jurriën Timber (DF)")
        break
save(f, data)


# ── Brazil ─────────────────────────────────────────────────────────────────────
# ESPN "Ederson" (#23 GK) was double-matched to Éderson Silva.
# • Éderson Silva (MF): keep espn_name="Éderson" (correct for him), keep his h/w
# • Ederson Moraes (GK): add espn_name="Ederson", add correct height/weight from ESPN
f, data = load("brazil")
for p in data["squad"]:
    if p["full_name"] == "Ederson Moraes":
        p["espn_name"] = "Ederson"
        # Ederson Moraes (Man City GK) standard ESPN stats
        p["height"] = "6' 2\""
        p["weight"] = "198 lbs"
        print("Brazil: Ederson Moraes — added espn_name + height/weight")
    elif p["full_name"] == "Éderson Silva":
        # His ESPN name IS "Éderson", his height/weight came from the correct ESPN entry
        print(f"Brazil: Éderson Silva — kept espn_name={p.get('espn_name')!r} h={p.get('height')} w={p.get('weight')}")
save(f, data)


# ── Uruguay ────────────────────────────────────────────────────────────────────
# "Maxi Araújo" (winger) and "Ronald Araújo" (CB) share surname.
# ESPN matched "Maxi Araújo" to Ronald Araújo — wrong. Fix:
# • Ronald Araújo: remove espn_name, clear wrong winger height/weight
# • Maximiliano Araújo: add espn_name="Maxi Araújo"
f, data = load("uruguay")
for p in data["squad"]:
    if p["full_name"] == "Ronald Araújo":
        p.pop("espn_name", None)
        p.pop("height", None)
        p.pop("weight", None)
        print("Uruguay: Ronald Araújo — removed wrong espn_name and winger h/w")
    elif p["full_name"] == "Maximiliano Araújo":
        p["espn_name"] = "Maxi Araújo"
        print("Uruguay: Maximiliano Araújo — added espn_name='Maxi Araújo'")
save(f, data)


# ── Egypt ──────────────────────────────────────────────────────────────────────
# Fuzzy matcher wrongly mapped ESPN "Mohamed Abdelmoneim" → stage4 "Mohamed Hany"
# and ESPN "Mostafa Shoubir" → stage4 "Mostafa Ziko" (later overwritten by "Zico").
# Correct: Abdelmoneim → Abdelmonem, Shoubir → Shobeir.
# Also remove the wrong alias from Mohamed Hany.
f, data = load("egypt")
for p in data["squad"]:
    if p["full_name"] == "Mohamed Hany":
        p.pop("espn_name", None)
        print("Egypt: Mohamed Hany — removed wrong espn_name (Abdelmoneim)")
    elif p["full_name"] == "Mohamed Abdelmonem":
        p["espn_name"] = "Mohamed Abdelmoneim"
        print("Egypt: Mohamed Abdelmonem — added espn_name='Mohamed Abdelmoneim'")
    elif p["full_name"] == "Mostafa Shobeir":
        p["espn_name"] = "Mostafa Shoubir"
        print("Egypt: Mostafa Shobeir — added espn_name='Mostafa Shoubir'")
    elif p["full_name"] == "Mostafa Ziko":
        # "Mostafa Zico" alias is correct (spelling variant), keep it
        print(f"Egypt: Mostafa Ziko — espn_name={p.get('espn_name')!r} (kept)")
save(f, data)

print("\nAll fixes applied.")
