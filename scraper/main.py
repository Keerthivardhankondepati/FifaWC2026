"""
Pipeline entry point.

Phase 6 — all 48 teams.
  Run:
    cd scraper
    python main.py

  Output: scraper/output/{slug}_stage1.json  (one file per team)
          scraper/logs/pipeline.log
"""

import json
from pathlib import Path

from stage1_collect import scrape_wiki_squad, scrape_espn_squad, scrape_wiki_history, scrape_team_list
from utils.logger import get_logger

_logger = get_logger("kickoff26.main")
_OUTPUT = Path(__file__).parent / "output"


def run_team(team: dict) -> dict:
    _logger.info("━━ Stage 1: %s (%s) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", team["country"], team["group"])
    squad   = scrape_wiki_squad(team)
    espn    = scrape_espn_squad(team)
    history = scrape_wiki_history(team)
    return {
        "country":       team["country"],
        "flag":          team["flag"],
        "group":         team["group"],
        "confederation": team["confederation"],
        "spotlight":     team["spotlight"],
        "squad":         squad,
        "espn":          espn,
        "history":       history,
    }


def main():
    _OUTPUT.mkdir(exist_ok=True)
    teams = scrape_team_list()

    succeeded, failed = [], []

    for team in teams:
        try:
            result = run_team(team)
            out_path = _OUTPUT / f"{team['slug']}_stage1.json"
            out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            succeeded.append(team["country"])
        except Exception as exc:
            _logger.error("Unhandled error for %s: %s", team["country"], exc)
            failed.append(team["country"])

    _logger.info("━━ STAGE 1 COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Succeeded : %d / %d", len(succeeded), len(teams))
    if failed:
        _logger.warning("Failed    : %s", ", ".join(failed))
    _logger.info("Output    : %s", _OUTPUT)


if __name__ == "__main__":
    main()
