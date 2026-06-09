import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

checks = [
    ("netherlands", "Timber"),
    ("brazil", "derson"),
    ("uruguay", "arau"),
    ("egypt", "Mostafa"),
    ("egypt", "Abdelmon"),
    ("egypt", "Mohamed Hany"),
]
for slug, frag in checks:
    data = json.loads(Path(f"output/{slug}_stage4.json").read_text(encoding="utf-8"))
    for p in data["squad"]:
        if frag.lower() in p["full_name"].lower():
            name = p["full_name"]
            pos  = p.get("position", "")
            espn = p.get("espn_name", "")
            h    = p.get("height", "")
            w    = p.get("weight", "")
            print(f"[{slug}] {name} | pos={pos} | espn={espn!r} | h={h} w={w}")
