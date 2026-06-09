import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
report = json.loads(Path("output/espn_verify/report.json").read_text(encoding="utf-8"))
targets = {"Türkiye", "Paraguay", "Jordan", "Iraq", "Saudi Arabia", "Morocco"}
for r in report:
    if r["country"] in targets:
        print(r["country"], "only_espn:", r["only_espn"])
        print(r["country"], "only_stage4:", r["only_stage4"])
        print()
