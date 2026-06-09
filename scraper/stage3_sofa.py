"""
Stage 3 — SOFA
SofaScore player IDs and current club data for all 48 teams.
Uses the sofascore-wrapper library (Playwright-based, bypasses anti-bot).

For each team:
  - Discovers SofaScore team ID via search_teams (national=True, football)
  - Fetches /team/{id}/players squad (26 players for WC squads)
  - Adds per player: sofa_player_id, sofa_club (cross-validate with Wikipedia)

IDs cached in data/sofa_id_cache.json so re-runs are instant.

Run:
  cd scraper
  python stage3_sofa.py

Output: scraper/output/{slug}_stage3.json
"""

import asyncio
import json
import unicodedata
from pathlib import Path

from sofascore_wrapper.api import SofascoreAPI
from sofascore_wrapper.search import Search
from sofascore_wrapper.team import Team

from teams_config import TEAMS
from utils.logger import get_logger

_logger = get_logger("kickoff26.stage3")
_OUTPUT  = Path(__file__).parent / "output"
_RAW_DIR = Path(__file__).parent / "data" / "raw" / "sofascore"
_CACHE   = Path(__file__).parent / "data" / "sofa_id_cache.json"

# Seconds to wait between SofaScore API calls (polite crawl)
_REQUEST_DELAY = 1.5

# Name overrides for SofaScore search (our name → SofaScore query)
_SEARCH_OVERRIDES: dict[str, str] = {
    "Czechia":                "Czech Republic",
    "Ivory Coast":            "Cote d'Ivoire",
    "DR Congo":               "DR Congo",
    "Bosnia and Herzegovina": "Bosnia",
    "United States":          "USA",
    # Türkiye: intentionally not overridden — "Türkiye" returns id=4700 directly
}

# Normalized name aliases: our country name → equivalent SofaScore names
_COUNTRY_ALIASES: dict[str, frozenset[str]] = {
    "united states": frozenset({"usa"}),
    "ivory coast":   frozenset({"cote d'ivoire"}),
}

# Tokens that indicate a non-senior-men national team (youth, women, futsal…)
_NON_SENIOR_TOKENS = frozenset({
    "u14", "u15", "u16", "u17", "u18", "u19", "u20", "u21", "u22", "u23",
    "women", "woman", "female", "futsal", "beach", "olympic",
})


def _is_senior_men(entity_name: str) -> bool:
    words = set(_normalize(entity_name).split())
    return not (words & _NON_SENIOR_TOKENS)


# ── helpers ────────────────────────────────────────────────────────────────────

def _normalize(name: str) -> str:
    nfkd = unicodedata.normalize("NFKD", name.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c)).strip()


def _load_cache() -> dict:
    if _CACHE.exists():
        return json.loads(_CACHE.read_text(encoding="utf-8"))
    return {}


def _save_cache(cache: dict) -> None:
    _CACHE.parent.mkdir(parents=True, exist_ok=True)
    _CACHE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")


# ── sofa_id discovery ─────────────────────────────────────────────────────────

async def _discover_sofa_id(api: SofascoreAPI, team: dict) -> int | None:
    """Search SofaScore for the national football team and return its ID."""
    country = team["country"]
    query   = _SEARCH_OVERRIDES.get(country, country)

    try:
        s      = Search(api, query)
        result = await s.search_teams(sport="football")
        hits   = result.get("results", [])
    except Exception as exc:
        _logger.warning("%s: SofaScore search error — %s", country, exc)
        return None

    norm = _normalize(country)

    # Pass 1: senior men national team whose name or country matches exactly
    valid_norms = _COUNTRY_ALIASES.get(norm, frozenset()) | {norm}
    for hit in hits:
        e = hit.get("entity", {})
        if not e.get("national", False):
            continue
        name_raw = e.get("name", "")
        if not _is_senior_men(name_raw):
            continue
        ename    = _normalize(name_raw)
        ecountry = _normalize(e.get("country", {}).get("name", ""))
        if ename in valid_norms or ecountry in valid_norms:
            sofa_id = e["id"]
            _logger.info("%s: sofa_id=%d (name='%s')", country, sofa_id, name_raw)
            return sofa_id

    # Pass 2: senior men national team with any word overlap
    norm_words = [w for w in norm.split() if len(w) > 3]
    for hit in hits:
        e = hit.get("entity", {})
        if not e.get("national", False):
            continue
        name_raw = e.get("name", "")
        if not _is_senior_men(name_raw):
            continue
        ename = _normalize(name_raw)
        if norm_words and any(w in ename for w in norm_words):
            sofa_id = e["id"]
            _logger.info("%s: sofa_id=%d (relaxed match, name='%s')", country, sofa_id, name_raw)
            return sofa_id

    _logger.warning("%s: no national team found on SofaScore", country)
    return None


# ── squad scraping ────────────────────────────────────────────────────────────

async def _fetch_squad(api: SofascoreAPI, sofa_id: int, team: dict) -> list[dict]:
    """Fetch SofaScore squad. Returns list of player dicts."""
    try:
        t          = Team(api, sofa_id)
        squad_data = await t.squad()
    except Exception as exc:
        _logger.error("%s: SofaScore squad fetch failed — %s", team["country"], exc)
        return []

    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    (_RAW_DIR / f"{team['slug']}.json").write_text(
        json.dumps(squad_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    players: list[dict] = []
    seen: set[str] = set()

    for entry in squad_data.get("players", []):
        pl = entry.get("player", {}) if isinstance(entry, dict) else {}
        name = pl.get("name") or pl.get("shortName") or ""
        if not name or name in seen:
            continue
        seen.add(name)

        # Extract club and league from player.team
        club_obj = pl.get("team") or {}
        club_name = club_obj.get("name", "")
        league_obj = (club_obj.get("tournament") or {}).get("uniqueTournament") or \
                     (club_obj.get("primaryUniqueTournament") or {})
        league_name = league_obj.get("name", "")

        players.append({
            "full_name":       name,
            "sofa_player_id":  pl.get("id"),
            "sofa_club":       club_name,
            "sofa_league":     league_name,
        })

    _logger.info("%s: SofaScore — %d players fetched", team["country"], len(players))
    return players


# ── enrichment ────────────────────────────────────────────────────────────────

def _enrich_team(stage2: dict, sofa_players: list[dict], sofa_id: int | None) -> dict:
    """Merge SofaScore player data into stage2 squad."""
    sofa_index = {_normalize(p["full_name"]): p for p in sofa_players}
    enriched: list[dict] = []

    for player in stage2.get("squad", []):
        p   = dict(player)
        key = _normalize(p.get("full_name", ""))

        sofa = sofa_index.get(key)
        if not sofa:
            # Fallback: last name match — only when exactly one SofaScore player
            # shares that last name. Skip when ambiguous (e.g. two players named Gueye).
            last = key.split()[-1] if key else ""
            if last:
                candidates = [v for k, v in sofa_index.items() if k.endswith(last)]
                sofa = candidates[0] if len(candidates) == 1 else None

        p["sofa_player_id"] = sofa["sofa_player_id"] if sofa else None
        p["sofa_club"]      = sofa["sofa_club"]      if sofa else None
        p["sofa_league"]    = sofa["sofa_league"]    if sofa else None

        enriched.append(p)

    result = dict(stage2)
    result["squad"]        = enriched
    result["sofa_team_id"] = sofa_id
    return result


# ── main ──────────────────────────────────────────────────────────────────────

async def _run_all() -> None:
    _OUTPUT.mkdir(exist_ok=True)
    cache = _load_cache()
    api   = SofascoreAPI()
    succeeded, failed, skipped = [], [], []

    try:
        for team in TEAMS:
            slug = team["slug"]
            _logger.info("━━ Stage 3: %s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", team["country"])

            stage2_path = _OUTPUT / f"{slug}_stage2.json"
            if not stage2_path.exists():
                _logger.warning("%s: stage2 file missing — skipping", team["country"])
                skipped.append(team["country"])
                continue

            stage2 = json.loads(stage2_path.read_text(encoding="utf-8"))

            try:
                # ── sofa_id (from cache or search) ────────────────────────
                if slug in cache and cache[slug] is not None:
                    sofa_id = cache[slug]
                else:
                    await asyncio.sleep(_REQUEST_DELAY)
                    sofa_id = await _discover_sofa_id(api, team)
                    cache[slug] = sofa_id
                    _save_cache(cache)

                # ── squad ─────────────────────────────────────────────────
                if sofa_id:
                    raw_path = _RAW_DIR / f"{slug}.json"
                    if raw_path.exists():
                        # reuse cached raw to avoid re-fetching
                        raw_data = json.loads(raw_path.read_text(encoding="utf-8"))
                        # re-parse from cached file
                        sofa_players: list[dict] = []
                        seen: set[str] = set()
                        for entry in raw_data.get("players", []):
                            pl = entry.get("player", {})
                            name = pl.get("name") or ""
                            if not name or name in seen:
                                continue
                            seen.add(name)
                            club_obj   = pl.get("team") or {}
                            league_obj = (club_obj.get("tournament") or {}).get("uniqueTournament") or \
                                         (club_obj.get("primaryUniqueTournament") or {})
                            sofa_players.append({
                                "full_name":      name,
                                "sofa_player_id": pl.get("id"),
                                "sofa_club":      club_obj.get("name", ""),
                                "sofa_league":    league_obj.get("name", ""),
                            })
                        _logger.info("%s: SofaScore — %d players (from cache)", team["country"], len(sofa_players))
                    else:
                        await asyncio.sleep(_REQUEST_DELAY)
                        sofa_players = await _fetch_squad(api, sofa_id, team)
                else:
                    sofa_players = []

                # ── merge + write ─────────────────────────────────────────
                result   = _enrich_team(stage2, sofa_players, sofa_id)
                matched  = sum(1 for p in result["squad"] if p.get("sofa_player_id"))
                _logger.info("%s: matched %d/%d players", team["country"], matched, len(result["squad"]))

                out_path = _OUTPUT / f"{slug}_stage3.json"
                out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
                succeeded.append(team["country"])

            except Exception as exc:
                _logger.error("Unhandled error for %s: %s", team["country"], exc, exc_info=True)
                failed.append(team["country"])

    finally:
        await api.close()

    _logger.info("━━ STAGE 3 COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Succeeded : %d / %d", len(succeeded), len(TEAMS))
    if skipped:
        _logger.warning("Skipped   : %s", ", ".join(skipped))
    if failed:
        _logger.warning("Failed    : %s", ", ".join(failed))


def main() -> None:
    asyncio.run(_run_all())


if __name__ == "__main__":
    main()
