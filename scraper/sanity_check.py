import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

checks = [
    ("mexico", "lvarez", "MF"),
    ("germany", "Kimmich", "MF"),
    ("netherlands", "Geertruida", None),
    ("netherlands", "Wieffer", "MF"),
    ("netherlands", "Timber", "DF"),
    ("uruguay", "Ronald", "DF"),
    ("south-korea", "Gi-hyuk", "MF"),
    ("brazil", "derson", None),
    ("egypt", "Ziko", "GK"),
    ("norway", "Ryerson", "DF"),
    ("spain", "Llorente", "MF"),
    ("argentina", "Almada", "MF"),
]

for slug, frag, expected in checks:
    f = Path("output") / f"{slug}_stage4.json"
    data = json.loads(f.read_text(encoding="utf-8"))
    found = [p for p in data["squad"] if frag.lower() in p["full_name"].lower()]
    if not found:
        label = "REMOVED ok" if expected is None else "MISSING!"
        print(f"[{slug}] {frag}: {label}")
    else:
        for p in found:
            pos = p.get("position")
            ok = (pos == expected) if expected else True
            status = "OK" if ok else f"WRONG (expected {expected})"
            print(f"[{slug}] {p['full_name']}: pos={pos} {status}")
