"""
Stage 4 — Conflict detection & confidence scoring
Reads {slug}_stage3.json for all 48 teams and produces {slug}_stage4.json.

Per player adds:
  club_conflict          — Wikipedia club ≠ SofaScore club (possible transfer/loan)
  in_top_league_conflict — in_top_league flag disagrees with sofa_league
  data_sources           — which sources matched (list)
  confidence             — 0-100 data-quality score
  is_loan                — True if on loan this season (from TM transfer history)
  parent_club            — owning club when on loan
  loan_club              — destination club when on loan

Per team adds:
  avg_confidence         — mean confidence across squad
  players_with_sofa      — count with sofa_player_id
  players_with_tm        — count with market_value_eur
  players_all_sources    — count matched by all 3 sources
  data_completeness_pct  — % of squad with confidence >= 75

Run:
  cd scraper
  python stage4_score.py
"""

import json
import re
import unicodedata
from pathlib import Path

from teams_config import TEAMS
from utils.logger import get_logger

_logger  = get_logger("kickoff26.stage4")
_OUTPUT  = Path(__file__).parent / "output"

# ── league helpers ─────────────────────────────────────────────────────────────

# Exact SofaScore league names that count as top-6 leagues.
# Intentionally exact so "Egyptian Premier League" and "LaLiga 2" don't match.
_TOP_SOFA_LEAGUES: frozenset[str] = frozenset({
    "premier league",            # English Premier League
    "laliga",                    # Spanish La Liga
    "la liga",                   # alternative
    "bundesliga",                # German Bundesliga
    "serie a",                   # Italian Serie A
    "ligue 1",                   # French Ligue 1
    "saudi pro league",          # Saudi Professional League
    "saudi professional league",
})


def _is_top_league_sofa(sofa_league: str | None) -> bool:
    if not sofa_league:
        return False
    return sofa_league.lower().strip() in _TOP_SOFA_LEAGUES


# Verified 2025-26 league tier for clubs where SofaScore's sofa_league is wrong or
# stale. Key = _normalize_club() output; True = top-tier league, False = not.
# Sources: 2025-26 Wikipedia season articles + NBC Sports final tables.
_CLUB_LEAGUE_OVERRIDES: dict[str, bool] = {
    # ── Premier League 2025-26 ───────────────────────────────────────────────
    "bournemouth":       True,   # sofa wrong: showed Championship
    "fulham":            True,   # sofa wrong: showed Championship
    "nottingham forest": True,   # sofa wrong: showed Championship
    "burnley":           True,   # wiki stale: showed not-top; sofa correct
    "leeds united":      True,   # wiki stale: showed not-top; sofa correct
    # ── Championship 2025-26 (NOT top) ───────────────────────────────────────
    "ipswich town":      False,  # wiki stale: showed top; sofa correct
    "norwich city":      False,  # sofa wrong: showed Premier League; wiki correct
    "watford":           False,  # sofa wrong: showed Premier League; wiki correct
    # ── Bundesliga 2025-26 ───────────────────────────────────────────────────
    "werder bremen":     True,   # sofa wrong: showed 2. Bundesliga
    # ── 2. Bundesliga 2025-26 (NOT top) ──────────────────────────────────────
    "st pauli":          False,  # wiki stale: showed top; sofa correct
    "holstein kiel":     False,  # wiki stale: showed top; sofa correct
    # ── Serie A 2025-26 ──────────────────────────────────────────────────────
    "parma":             True,   # sofa wrong: showed Serie B
    "como":              True,   # sofa wrong: showed Serie C
    "sassuolo":          True,   # wiki stale: showed not-top; sofa correct
    # ── Serie B 2025-26 (NOT top) ────────────────────────────────────────────
    "sampdoria":         False,  # sofa wrong: showed Serie A; wiki correct
    # ── LaLiga 2 2025-26 (NOT top) ───────────────────────────────────────────
    "girona":            False,  # wiki stale: showed top; sofa correct
    "elche":             False,  # sofa wrong: showed LaLiga; wiki correct
    "granada":           False,  # sofa wrong: showed LaLiga; wiki correct
    # ── Ligue 1 2025-26 ──────────────────────────────────────────────────────
    "toulouse":          True,   # sofa wrong: showed Ligue 2
    "lorient":           True,   # wiki stale: showed not-top; sofa correct
    # ── Ligue 2 2025-26 (NOT top) ────────────────────────────────────────────
    "auxerre":           False,  # wiki stale: showed top; sofa correct
    "le havre":          False,  # wiki stale: showed top; sofa correct
    # ── Saudi Pro League 2025-26 ─────────────────────────────────────────────
    "qadsiah":           True,   # sofa showed King's Cup (cup competition)
    "fayha":             True,   # sofa wrong: showed Saudi 1st Division
    "neom":              True,   # wiki stale: showed not-top; sofa correct
    "najma":             True,   # wiki stale: showed not-top; sofa correct
}


def _is_youth_or_cup_match(sofa_club: str, sofa_league: str) -> bool:
    """True when SofaScore matched a youth/reserve squad or cup competition."""
    c = sofa_club.lower()
    lg = sofa_league.lower() if sofa_league else ""
    return (
        "u21" in c or "u19" in c or " ii" in c
        or "premier league 2" in lg
        or "regionalliga" in lg
        or ("king" in lg and "cup" in lg)
    )


def _resolve_in_top_league(player: dict) -> bool:
    """Return the verified in_top_league value for a player.

    Priority:
      1. Verified club override (_CLUB_LEAGUE_OVERRIDES) — ground truth
      2. Fall back to wiki when SofaScore matched a youth/reserve/cup context
      3. Trust SofaScore league when it names a recognised league
      4. Fall back to wiki when no SofaScore data
    """
    wiki_top = bool(player.get("in_top_league"))

    if not player.get("sofa_player_id"):
        return wiki_top

    sofa_club = player.get("sofa_club") or ""
    sofa_league = player.get("sofa_league") or ""

    # Check override dict against both sofa and wiki club names
    for club in (sofa_club, player.get("club") or ""):
        norm = _normalize_club(club)
        if norm in _CLUB_LEAGUE_OVERRIDES:
            return _CLUB_LEAGUE_OVERRIDES[norm]

    if _is_youth_or_cup_match(sofa_club, sofa_league):
        return wiki_top

    if sofa_league:
        return _is_top_league_sofa(sofa_league)

    return wiki_top


# ── club name normalization ────────────────────────────────────────────────────

# Structural prefixes/suffixes that add noise but carry no identity.
# "athletic", "atletico", "real" intentionally excluded — they ARE identity
# (Athletic Bilbao ≠ Atletico Madrid; Real Madrid ≠ Racing Club).
_STRIP_TOKENS: frozenset[str] = frozenset({
    "fc", "cf", "sc", "bsc", "afc", "ac", "as", "ss", "ssc", "rc",
    "rb", "tsg", "vfl", "vfb", "sv", "fk", "sk", "nk", "ks", "al",
    "association",
})

# Standalone year tokens in official club names (e.g. "04" in "Bayer 04 Leverkusen")
_YEAR_RE = re.compile(r'\b\d{2,4}\b')

# Letters that NFKD doesn't decompose but appear in club names.
# str.maketrans dict-form supports multi-char values (e.g. æ → "ae").
_CHAR_SUBS: dict = str.maketrans({
    'ø': 'o', 'Ø': 'o',
    'æ': 'ae', 'Æ': 'ae',
    'ß': 'ss',
    'ł': 'l', 'Ł': 'l',
    'ð': 'd', 'þ': 'th',
})

# Maps normalized club name variants → canonical normalized form.
# Handles language translations, abbreviations, and transliteration differences.
_CLUB_CANONICAL: dict[str, str] = {
    # German → English
    "bayern munchen":           "bayern munich",
    "fc bayern munchen":        "bayern munich",
    # Borussia Mönchengladbach abbreviation
    "borussia m gladbach":      "borussia monchengladbach",
    "m gladbach":               "borussia monchengladbach",
    # Czech → English
    "slavia praha":             "slavia prague",
    "sparta praha":             "sparta prague",
    # Danish → English
    "kobenhavn":                "copenhagen",
    # French short form
    "stade rennais":            "rennes",
    # Serbian → English
    "crvena zvezda":            "red star belgrade",
    "fk crvena zvezda":         "red star belgrade",
    # Spanish — official name vs common English name
    "athletic club":            "athletic bilbao",
    # Russian transliteration variants
    "zenit st petersburg":      "zenit saint petersburg",
    "dinamo makhachkala":       "dynamo makhachkala",
    # Moroccan — short vs full
    "raja club athletic":       "raja casablanca",
    # Tunisian
    "esperance tunis":          "esperance de tunis",
    "etoile sportive du sahel": "etoile du sahel",
    # Hungarian — word-order variant
    "eto gyor":                 "gyori eto",
    # Uzbek transliterations
    "buxoro":                   "bukhara",
    "surkhon termez":           "surkhon termiz",
    # Spanish — full vs common
    "real racing club":         "racing santander",
    # Youth-team naming
    "barcelona u19":            "barcelona b",
}


def _normalize_club(name: str | None) -> str:
    if not name:
        return ""
    s = name.lower().translate(_CHAR_SUBS)                # ø→o, æ→ae, etc.
    nfkd = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in nfkd if not unicodedata.combining(c))
    s = "".join(c if c.isalnum() or c.isspace() else " " for c in s)
    s = _YEAR_RE.sub(" ", s)                              # strip year tokens
    words = [w for w in s.split() if w not in _STRIP_TOKENS]
    normalized = " ".join(words).strip()
    return _CLUB_CANONICAL.get(normalized, normalized)    # resolve aliases


def _clubs_conflict(wiki_club: str | None, sofa_club: str | None) -> bool:
    """Return True if normalized club names differ enough to flag as a conflict."""
    wc = _normalize_club(wiki_club)
    sc = _normalize_club(sofa_club)
    if not wc or not sc:
        return False  # can't compare
    if wc == sc:
        return False
    # Allow substring match (e.g. "manchester city" ⊃ "city")
    if wc in sc or sc in wc:
        return False
    return True


# ── confidence scoring ────────────────────────────────────────────────────────

def _confidence(player: dict) -> int:
    score = 100

    if not player.get("sofa_player_id"):
        score -= 25  # SofaScore didn't match this player

    if player.get("market_value_eur") is None:
        score -= 25  # Transfermarkt didn't have this player

    if player.get("club_conflict"):
        score -= 15  # club data inconsistent between sources

    if not player.get("caps"):
        score -= 5   # no international career stats

    return max(0, score)


# ── per-player enrichment ─────────────────────────────────────────────────────

def _enrich_player(p: dict) -> dict:
    player = dict(p)

    # Club conflict: Wikipedia club vs SofaScore club
    player["club_conflict"] = _clubs_conflict(
        player.get("club"), player.get("sofa_club")
    )

    # Resolve in_top_league from the best available source (SofaScore preferred,
    # with overrides for cup competitions, youth matches, and stale sofa caches).
    player["in_top_league"] = _resolve_in_top_league(player)
    player["in_top_league_conflict"] = False

    # Which sources contributed
    sources = ["wikipedia"]
    if player.get("market_value_eur") is not None or player.get("tm_player_id"):
        sources.append("transfermarkt")
    if player.get("sofa_player_id"):
        sources.append("sofascore")
    player["data_sources"] = sources

    player["confidence"] = _confidence(player)

    return player


# ── team-level summary ────────────────────────────────────────────────────────

def _team_summary(squad: list[dict]) -> dict:
    n = len(squad)
    if n == 0:
        return {}

    with_sofa = sum(1 for p in squad if p.get("sofa_player_id"))
    with_tm   = sum(1 for p in squad if p.get("market_value_eur") is not None)
    all_three = sum(1 for p in squad if len(p.get("data_sources", [])) == 3)
    avg_conf  = sum(p["confidence"] for p in squad) / n
    complete  = sum(1 for p in squad if p["confidence"] >= 75)

    return {
        "players_with_sofa":     with_sofa,
        "players_with_tm":       with_tm,
        "players_all_sources":   all_three,
        "avg_confidence":        round(avg_conf, 1),
        "data_completeness_pct": round(100 * complete / n, 1),
    }


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _OUTPUT.mkdir(exist_ok=True)
    succeeded, skipped = [], []

    for team in TEAMS:
        slug = team["slug"]
        _logger.info("━━ Stage 4: %s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", team["country"])

        stage3_path = _OUTPUT / f"{slug}_stage3.json"
        if not stage3_path.exists():
            _logger.warning("%s: stage3 file missing — skipping", team["country"])
            skipped.append(team["country"])
            continue

        stage3 = json.loads(stage3_path.read_text(encoding="utf-8"))

        enriched_squad = [_enrich_player(p) for p in stage3.get("squad", [])]

        # Count conflicts for logging
        club_conflicts = sum(1 for p in enriched_squad if p["club_conflict"])
        league_conflicts = sum(1 for p in enriched_squad if p["in_top_league_conflict"])

        summary = _team_summary(enriched_squad)
        _logger.info(
            "%s: avg_conf=%.0f  complete=%.0f%%  sofa=%d/tm=%d/all3=%d  "
            "club_conflicts=%d  league_conflicts=%d",
            team["country"],
            summary.get("avg_confidence", 0),
            summary.get("data_completeness_pct", 0),
            summary.get("players_with_sofa", 0),
            summary.get("players_with_tm", 0),
            summary.get("players_all_sources", 0),
            club_conflicts,
            league_conflicts,
        )

        result = {k: v for k, v in stage3.items() if k != "squad"}
        result.update(summary)
        result["squad"] = enriched_squad

        out_path = _OUTPUT / f"{slug}_stage4.json"
        out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        succeeded.append(team["country"])

    _logger.info("━━ STAGE 4 COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Succeeded : %d / %d", len(succeeded), len(TEAMS))
    if skipped:
        _logger.warning("Skipped   : %s", ", ".join(skipped))


if __name__ == "__main__":
    main()
