"""
Stage 5 — Export

Reads all 48 {slug}_stage4.json files and produces:
  output/export/team_reviews.json   — website-ready team array (with squad)
  output/export/teams.csv           — 48-row team summary
  output/export/players.csv         — all players flat (1,245 rows)
  website/data/teams.js             — JS module wrapping team_reviews.json

Run:
  cd scraper
  python stage5_export.py
"""

import csv
import json
import sys
from pathlib import Path

from utils.logger import get_logger

_logger = get_logger("kickoff26.stage5")

_SCRAPER   = Path(__file__).parent
_OUTPUT    = _SCRAPER / "output"
_EXPORT    = _OUTPUT  / "export"
_WEBSITE   = _SCRAPER.parent / "website" / "data"


# ── helpers ────────────────────────────────────────────────────────────────────

def _fmt_value(eur: int | None) -> str | None:
    if eur is None:
        return None
    if eur >= 1_000_000:
        m = eur / 1_000_000
        return f"€{m:.0f}m" if m == int(m) else f"€{m:.1f}m"
    if eur >= 1_000:
        return f"€{eur // 1_000}k"
    return f"€{eur}"


def _player_export(p: dict, country: str, group: str) -> dict:
    """Return a clean player dict suitable for JSON export and CSV."""
    return {
        # identity
        "player_id":          p.get("player_id"),
        "country":            country,
        "group":              group,
        "full_name":          p.get("full_name"),
        "espn_name":          p.get("espn_name"),
        "squad_number":       p.get("squad_number"),
        "position":           p.get("position"),
        # bio
        "date_of_birth":      p.get("date_of_birth"),
        "age":                p.get("age"),
        "height":             p.get("height"),
        "weight":             p.get("weight"),
        # club
        "club":               p.get("club"),
        "league":             p.get("league"),
        "in_top_league":      p.get("in_top_league"),
        # career
        "caps":               p.get("caps"),
        "international_goals": p.get("international_goals"),
        # transfermarkt
        "market_value_eur":   p.get("market_value_eur"),
        "market_value_fmt":   _fmt_value(p.get("market_value_eur")),
        "tm_player_id":       p.get("tm_player_id"),
        # sofascore
        "sofa_player_id":     p.get("sofa_player_id"),
        "sofa_club":          p.get("sofa_club"),
        "sofa_league":        p.get("sofa_league"),
        # quality
        "club_conflict":      p.get("club_conflict"),
        "confidence":         p.get("confidence"),
        "data_sources":       p.get("data_sources", []),
    }


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    _EXPORT.mkdir(parents=True, exist_ok=True)
    _WEBSITE.mkdir(parents=True, exist_ok=True)

    stage4_files = sorted(_OUTPUT.glob("*_stage4.json"))
    if not stage4_files:
        _logger.error("No stage4 files found in %s", _OUTPUT)
        sys.exit(1)

    team_reviews = []
    all_players  = []

    for f in stage4_files:
        raw = json.loads(f.read_text(encoding="utf-8"))

        country       = raw["country"]
        group         = raw.get("group", "")
        history       = raw.get("history") or {}
        squad_raw     = raw.get("squad", [])

        # Build enriched player list
        squad_export = [_player_export(p, country, group) for p in squad_raw]
        all_players.extend(squad_export)

        # Team entry
        team_entry = {
            "country":              country,
            "flag_emoji":           raw.get("flag", ""),
            "group":                group,
            "confederation":        raw.get("confederation", ""),
            "spotlight":            bool(raw.get("spotlight", False)),
            "manager":              history.get("manager"),
            "wc_appearances":       history.get("wc_appearances"),
            "wc_debut_year":        history.get("wc_debut_year"),
            "wc_best_finish":       history.get("wc_best_finish"),
            "squad_total_value_eur": raw.get("squad_total_value_eur"),
            "avg_confidence":       raw.get("avg_confidence"),
            "data_completeness_pct": raw.get("data_completeness_pct"),
            "players_with_sofa":    raw.get("players_with_sofa"),
            "players_with_tm":      raw.get("players_with_tm"),
            "players_all_sources":  raw.get("players_all_sources"),
            # content fields — filled manually for spotlight teams
            "story":                "",
            "fun_fact":             "",
            "key_players":          [],
            "squad":                squad_export,
        }
        team_reviews.append(team_entry)
        _logger.info("%s: %d players exported", country, len(squad_export))

    # Sort by group then country for readability
    team_reviews.sort(key=lambda t: (t["group"], t["country"]))

    # ── team_reviews.json ──────────────────────────────────────────────────────
    tr_path = _EXPORT / "team_reviews.json"
    tr_path.write_text(
        json.dumps(team_reviews, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    _logger.info("Wrote %s (%d teams)", tr_path, len(team_reviews))

    # ── teams.csv ─────────────────────────────────────────────────────────────
    teams_csv_cols = [
        "country", "flag_emoji", "group", "confederation", "spotlight",
        "manager", "wc_appearances", "wc_debut_year", "wc_best_finish",
        "squad_total_value_eur", "avg_confidence", "data_completeness_pct",
        "players_with_sofa", "players_with_tm", "players_all_sources",
    ]
    teams_csv_path = _EXPORT / "teams.csv"
    with teams_csv_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=teams_csv_cols, extrasaction="ignore")
        w.writeheader()
        for t in team_reviews:
            w.writerow(t)
    _logger.info("Wrote %s", teams_csv_path)

    # ── players.csv ───────────────────────────────────────────────────────────
    players_csv_cols = [
        "player_id", "country", "group", "full_name", "espn_name",
        "squad_number", "position", "date_of_birth", "age", "height", "weight",
        "club", "league", "in_top_league",
        "caps", "international_goals",
        "market_value_eur", "market_value_fmt",
        "tm_player_id",
        "sofa_player_id", "sofa_club", "sofa_league",
        "club_conflict", "confidence", "data_sources",
    ]
    players_csv_path = _EXPORT / "players.csv"
    with players_csv_path.open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=players_csv_cols, extrasaction="ignore")
        w.writeheader()
        for p in all_players:
            row = dict(p)
            row["data_sources"] = ";".join(p.get("data_sources") or [])
            w.writerow(row)
    _logger.info("Wrote %s (%d players)", players_csv_path, len(all_players))

    # ── website/data/teams.js ─────────────────────────────────────────────────
    teams_js_path = _WEBSITE / "teams.js"
    js_body = json.dumps(team_reviews, ensure_ascii=False, indent=2)
    teams_js_path.write_text(
        f"// Auto-generated by stage5_export.py — do not edit manually\n"
        f"export const TEAMS = {js_body};\n",
        encoding="utf-8",
    )
    _logger.info("Wrote %s", teams_js_path)

    # ── summary ───────────────────────────────────────────────────────────────
    spotlight_count = sum(1 for t in team_reviews if t["spotlight"])
    with_sofa  = sum(1 for p in all_players if p.get("sofa_player_id"))
    with_tm    = sum(1 for p in all_players if p.get("market_value_eur"))
    with_hw    = sum(1 for p in all_players if p.get("height"))
    with_alias = sum(1 for p in all_players if p.get("espn_name"))

    _logger.info("━━ STAGE 5 COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Teams:          %d  (%d spotlight)", len(team_reviews), spotlight_count)
    _logger.info("Players:        %d", len(all_players))
    _logger.info("With SofaScore: %d (%.0f%%)", with_sofa,  100*with_sofa/len(all_players))
    _logger.info("With TM value:  %d (%.0f%%)", with_tm,    100*with_tm/len(all_players))
    _logger.info("With height/wt: %d (%.0f%%)", with_hw,    100*with_hw/len(all_players))
    _logger.info("With ESPN alias:%d (%.0f%%)", with_alias, 100*with_alias/len(all_players))
    _logger.info("Output dir:     %s", _EXPORT)


if __name__ == "__main__":
    main()
