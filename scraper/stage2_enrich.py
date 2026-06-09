"""
Stage 2 — ENRICH
Adds Transfermarkt market values to every player from Stage 1.

  Spotlight teams  (31): all squad members enriched with market value
  Non-spotlight    (17): same enrichment; top_player=True for players
                         whose club is in a TOP_LEAGUES league

Run:
  cd scraper
  python stage2_enrich.py

Output: scraper/output/{slug}_stage2.json  (one file per team)
"""

import json
import re
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup

from teams_config import TEAMS, TOP_LEAGUES
from utils.http_client import get
from utils.logger import get_logger

_logger    = get_logger("kickoff26.stage2")
_OUTPUT    = Path(__file__).parent / "output"
_RAW_DIR   = Path(__file__).parent / "data" / "raw" / "transfermarkt"
_LOAN_DIR  = Path(__file__).parent / "data" / "raw" / "transfermarkt" / "loan_history"
_TM_BASE   = "https://www.transfermarkt.com"

# TM transfer-type strings that mean "currently on loan"
_LOAN_TYPES: frozenset[str] = frozenset({
    "loan transfer", "on loan", "loan",
})

# ── club → league lookup (Wikipedia/common English names, lower-cased) ────────
_CLUB_LEAGUE: dict[str, str] = {
    # Premier League
    "arsenal": "Premier League",
    "chelsea": "Premier League",
    "liverpool": "Premier League",
    "manchester city": "Premier League",
    "manchester united": "Premier League",
    "tottenham hotspur": "Premier League",
    "tottenham": "Premier League",
    "aston villa": "Premier League",
    "newcastle united": "Premier League",
    "newcastle": "Premier League",
    "west ham united": "Premier League",
    "west ham": "Premier League",
    "everton": "Premier League",
    "brighton & hove albion": "Premier League",
    "brighton": "Premier League",
    "crystal palace": "Premier League",
    "fulham": "Premier League",
    "wolverhampton wanderers": "Premier League",
    "wolverhampton": "Premier League",
    "wolves": "Premier League",
    "brentford": "Premier League",
    "nottingham forest": "Premier League",
    "bournemouth": "Premier League",
    "afc bournemouth": "Premier League",
    "leicester city": "Premier League",
    "leicester": "Premier League",
    "southampton": "Premier League",
    "ipswich town": "Premier League",
    "ipswich": "Premier League",
    # La Liga
    "real madrid": "La Liga",
    "fc barcelona": "La Liga",
    "barcelona": "La Liga",
    "atlético madrid": "La Liga",
    "atletico madrid": "La Liga",
    "atlético de madrid": "La Liga",
    "atletico de madrid": "La Liga",
    "sevilla": "La Liga",
    "sevilla fc": "La Liga",
    "real betis": "La Liga",
    "betis": "La Liga",
    "valencia": "La Liga",
    "valencia cf": "La Liga",
    "villarreal": "La Liga",
    "villarreal cf": "La Liga",
    "athletic club": "La Liga",
    "athletic bilbao": "La Liga",
    "real sociedad": "La Liga",
    "osasuna": "La Liga",
    "ca osasuna": "La Liga",
    "girona": "La Liga",
    "girona fc": "La Liga",
    "rayo vallecano": "La Liga",
    "celta vigo": "La Liga",
    "rc celta": "La Liga",
    "las palmas": "La Liga",
    "ud las palmas": "La Liga",
    "getafe": "La Liga",
    "getafe cf": "La Liga",
    "alavés": "La Liga",
    "alaves": "La Liga",
    "deportivo alavés": "La Liga",
    "leganés": "La Liga",
    "leganes": "La Liga",
    "cd leganés": "La Liga",
    "espanyol": "La Liga",
    "rcd espanyol": "La Liga",
    "valladolid": "La Liga",
    "real valladolid": "La Liga",
    "mallorca": "La Liga",
    "rcd mallorca": "La Liga",
    # Bundesliga
    "bayern munich": "Bundesliga",
    "fc bayern münchen": "Bundesliga",
    "fc bayern munich": "Bundesliga",
    "borussia dortmund": "Bundesliga",
    "bayer leverkusen": "Bundesliga",
    "bayer 04 leverkusen": "Bundesliga",
    "rb leipzig": "Bundesliga",
    "vfb stuttgart": "Bundesliga",
    "stuttgart": "Bundesliga",
    "eintracht frankfurt": "Bundesliga",
    "sc freiburg": "Bundesliga",
    "freiburg": "Bundesliga",
    "tsg hoffenheim": "Bundesliga",
    "hoffenheim": "Bundesliga",
    "vfl wolfsburg": "Bundesliga",
    "wolfsburg": "Bundesliga",
    "borussia mönchengladbach": "Bundesliga",
    "borussia monchengladbach": "Bundesliga",
    "sv werder bremen": "Bundesliga",
    "werder bremen": "Bundesliga",
    "1. fsv mainz 05": "Bundesliga",
    "fsv mainz 05": "Bundesliga",
    "mainz": "Bundesliga",
    "fc augsburg": "Bundesliga",
    "augsburg": "Bundesliga",
    "1. fc union berlin": "Bundesliga",
    "union berlin": "Bundesliga",
    "holstein kiel": "Bundesliga",
    "1. fc heidenheim 1846": "Bundesliga",
    "heidenheim": "Bundesliga",
    "fc st. pauli": "Bundesliga",
    "st. pauli": "Bundesliga",
    "vfl bochum": "Bundesliga",
    "bochum": "Bundesliga",
    # Serie A
    "inter milan": "Serie A",
    "fc internazionale milano": "Serie A",
    "internazionale": "Serie A",
    "inter": "Serie A",
    "juventus": "Serie A",
    "juventus fc": "Serie A",
    "ac milan": "Serie A",
    "milan": "Serie A",
    "napoli": "Serie A",
    "ssc napoli": "Serie A",
    "roma": "Serie A",
    "as roma": "Serie A",
    "lazio": "Serie A",
    "ss lazio": "Serie A",
    "atalanta": "Serie A",
    "atalanta bc": "Serie A",
    "fiorentina": "Serie A",
    "acf fiorentina": "Serie A",
    "torino": "Serie A",
    "torino fc": "Serie A",
    "bologna": "Serie A",
    "bologna fc": "Serie A",
    "udinese": "Serie A",
    "udinese calcio": "Serie A",
    "genoa": "Serie A",
    "genoa cfc": "Serie A",
    "cagliari": "Serie A",
    "cagliari calcio": "Serie A",
    "lecce": "Serie A",
    "us lecce": "Serie A",
    "hellas verona": "Serie A",
    "verona": "Serie A",
    "empoli": "Serie A",
    "empoli fc": "Serie A",
    "venezia": "Serie A",
    "venezia fc": "Serie A",
    "como": "Serie A",
    "como 1907": "Serie A",
    "parma": "Serie A",
    "parma calcio": "Serie A",
    "monza": "Serie A",
    "ac monza": "Serie A",
    # Ligue 1
    "paris saint-germain": "Ligue 1",
    "psg": "Ligue 1",
    "as monaco": "Ligue 1",
    "monaco": "Ligue 1",
    "olympique lyonnais": "Ligue 1",
    "lyon": "Ligue 1",
    "olympique de marseille": "Ligue 1",
    "olympique marseille": "Ligue 1",
    "marseille": "Ligue 1",
    "losc lille": "Ligue 1",
    "lille": "Ligue 1",
    "ogc nice": "Ligue 1",
    "nice": "Ligue 1",
    "stade rennais fc": "Ligue 1",
    "rennes": "Ligue 1",
    "rc lens": "Ligue 1",
    "lens": "Ligue 1",
    "fc nantes": "Ligue 1",
    "nantes": "Ligue 1",
    "rc strasbourg": "Ligue 1",
    "strasbourg": "Ligue 1",
    "toulouse fc": "Ligue 1",
    "toulouse": "Ligue 1",
    "le havre": "Ligue 1",
    "le havre ac": "Ligue 1",
    "sco angers": "Ligue 1",
    "angers": "Ligue 1",
    "aj auxerre": "Ligue 1",
    "auxerre": "Ligue 1",
    "stade brestois 29": "Ligue 1",
    "brest": "Ligue 1",
    "as saint-étienne": "Ligue 1",
    "saint-étienne": "Ligue 1",
    "saint-etienne": "Ligue 1",
    "stade de reims": "Ligue 1",
    "reims": "Ligue 1",
    "montpellier hsc": "Ligue 1",
    "montpellier": "Ligue 1",
    # Saudi Pro League
    "al-hilal": "Saudi Pro League",
    "al hilal": "Saudi Pro League",
    "al-nassr": "Saudi Pro League",
    "al nassr": "Saudi Pro League",
    "al-nassr fc": "Saudi Pro League",
    "al-ittihad": "Saudi Pro League",
    "al ittihad": "Saudi Pro League",
    "al-ittihad fc": "Saudi Pro League",
    "al-ahli": "Saudi Pro League",
    "al ahli": "Saudi Pro League",
    "al-ahli saudi fc": "Saudi Pro League",
    "al-qadsiah": "Saudi Pro League",
    "al-shabab": "Saudi Pro League",
    "al-fayha": "Saudi Pro League",
    "al-riyadh": "Saudi Pro League",
    "damac": "Saudi Pro League",
    "damac fc": "Saudi Pro League",
    "al-khaleej": "Saudi Pro League",
    "al-ettifaq": "Saudi Pro League",
    "al-hazm": "Saudi Pro League",
    "al-okhdood": "Saudi Pro League",
    "al-wehda": "Saudi Pro League",
    "al-taawoun": "Saudi Pro League",
    "al-fateh": "Saudi Pro League",
}


def _get_club_league(club: str) -> str | None:
    """Return league name for club, or None if not a top-6 league club."""
    return _CLUB_LEAGUE.get(club.strip().lower())


def _parse_market_value(raw: str) -> int | None:
    """Convert '€12.00m' → 12_000_000, '€500k' → 500_000."""
    m = re.search(r"€([\d.,]+)\s*(m|k|bn)", raw.strip(), re.I)
    if not m:
        return None
    amount = float(m.group(1).replace(",", "."))
    unit = m.group(2).lower()
    if unit == "bn":
        return int(amount * 1_000_000_000)
    if unit == "m":
        return int(amount * 1_000_000)
    if unit == "k":
        return int(amount * 1_000)
    return None


def _normalize(name: str) -> str:
    """Lowercase + strip diacritics for fuzzy name matching."""
    nfkd = unicodedata.normalize("NFKD", name.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c)).strip()


def scrape_tm_squad(team: dict, force_refresh: bool = False) -> list[dict]:
    """
    Fetch TM squad page. Returns a list of player dicts with:
    full_name, squad_number, position, age, market_value_eur, club_tm.
    Uses cached HTML when available; pass force_refresh=True to re-fetch.
    """
    tm_id   = team.get("tm_id")
    tm_slug = team.get("tm_slug")
    if not tm_id or not tm_slug:
        _logger.warning("%s: tm_id/tm_slug not set — skipping Transfermarkt", team["country"])
        return []

    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = _RAW_DIR / f"{team['slug']}.html"

    if cache_path.exists() and not force_refresh:
        html = cache_path.read_text(encoding="utf-8")
        _logger.info("%s: TM squad — using cached HTML", team["country"])
    else:
        url = f"{_TM_BASE}/{tm_slug}/kader/verein/{tm_id}/saison_id/2026"
        response = get(url)
        if not response:
            _logger.error("%s: TM request failed — %s", team["country"], url)
            return []
        html = response.text
        cache_path.write_text(html, encoding="utf-8")

    soup = BeautifulSoup(html, "lxml")

    # Sanity check: at least one meaningful word from the country name appears in the title
    h1 = soup.find("h1")
    if h1:
        page_title = h1.get_text().lower()
        country_words = [w for w in team["country"].lower().split() if len(w) > 2]
        if country_words and not any(w in page_title for w in country_words):
            _logger.warning("%s: TM page title mismatch — got '%s'", team["country"], h1.get_text(strip=True)[:60])

    players: list[dict] = []
    seen: set[str] = set()

    for row in soup.select("table.items tbody tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 7:
            continue  # skip sub-rows (2-cell duplicate rows)

        squad_number_raw = cells[0].get_text(strip=True)
        try:
            squad_number = int(squad_number_raw)
        except ValueError:
            continue

        full_name = cells[3].get_text(strip=True)
        if not full_name or full_name in seen:
            continue
        seen.add(full_name)

        # Extract TM player profile link: /{slug}/profil/spieler/{id}
        profile_link = cells[1].find("a", href=lambda h: h and "/profil/spieler/" in h)
        if profile_link:
            parts = profile_link["href"].strip("/").split("/")
            # href format: /player-slug/profil/spieler/12345
            tm_player_id   = parts[-1] if parts[-1].isdigit() else None
            tm_player_slug = parts[0] if parts else None
        else:
            tm_player_id   = None
            tm_player_slug = None

        position      = cells[4].get_text(strip=True)
        age_raw       = cells[5].get_text(strip=True)
        age           = int(age_raw) if age_raw.isdigit() else None
        club_tag      = cells[6].find("a")
        club_tm       = club_tag["title"] if club_tag and club_tag.get("title") else ""
        value_raw     = cells[7].get_text(strip=True) if len(cells) > 7 else ""
        market_value  = _parse_market_value(value_raw)

        players.append({
            "full_name":        full_name,
            "squad_number":     squad_number,
            "position":         position,
            "age":              age,
            "club_tm":          club_tm,
            "market_value_eur": market_value,
            "tm_player_id":     tm_player_id,
            "tm_player_slug":   tm_player_slug,
        })

    _logger.info("%s: TM squad — %d players scraped", team["country"], len(players))
    return players


def scrape_tm_loan_status(tm_player_slug: str, tm_player_id: str) -> dict | None:
    """
    Fetch the player's TM transfer history and return loan status for 25/26.

    Returns a dict with:
      is_loan     — True if currently on loan
      parent_club — club that owns the contract (the 'left' side of the loan transfer)
      loan_club   — club the player is loaned to (the 'joined' side)
    or None if the page could not be fetched or no loan entry found.

    Results are cached to data/raw/transfermarkt/loan_history/{id}.html.
    """
    _LOAN_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = _LOAN_DIR / f"{tm_player_id}.html"

    if cache_path.exists():
        html = cache_path.read_text(encoding="utf-8")
    else:
        url = f"{_TM_BASE}/{tm_player_slug}/transfers/spieler/{tm_player_id}"
        response = get(url)
        if not response:
            _logger.warning("Loan fetch failed for player id=%s", tm_player_id)
            return None
        html = response.text
        cache_path.write_text(html, encoding="utf-8")

    soup = BeautifulSoup(html, "lxml")

    # TM transfer history table: each row is one transfer
    # Columns: season | date | left (from-club) | → | joined (to-club) | market value | fee
    # We look for season 25/26 with fee text containing "loan"
    for row in soup.select("table.grid tbody tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 5:
            continue

        season_text = cells[0].get_text(strip=True)
        if "25/26" not in season_text and "2025" not in season_text and "2026" not in season_text:
            continue

        # Fee cell is the last meaningful cell; contains "Loan transfer", "€Xm", "Free", etc.
        fee_text = cells[-1].get_text(strip=True).lower()
        if not any(lt in fee_text for lt in _LOAN_TYPES):
            continue

        # Extract parent club (left) and loan club (joined)
        # TM layout: cells[2] = left club, cells[4] = joined club
        left_tag   = cells[2].find("a") if len(cells) > 2 else None
        joined_tag = cells[4].find("a") if len(cells) > 4 else None

        parent_club = left_tag.get_text(strip=True) if left_tag else cells[2].get_text(strip=True)
        loan_club   = joined_tag.get_text(strip=True) if joined_tag else cells[4].get_text(strip=True)

        if parent_club and loan_club:
            _logger.info(
                "Loan detected (id=%s): %s → %s", tm_player_id, parent_club, loan_club
            )
            return {"is_loan": True, "parent_club": parent_club, "loan_club": loan_club}

    # No loan row found in 25/26 — return False only if we could parse a table;
    # otherwise None means the page structure changed (web component, no static table).
    has_table = bool(soup.select("table.grid"))
    if has_table:
        return {"is_loan": False, "parent_club": None, "loan_club": None}
    return None  # Could not determine — TM transfer history uses JS web component


def _build_tm_index(tm_players: list[dict]) -> dict[str, dict]:
    """Index TM players by normalized name for fast lookup."""
    return {_normalize(p["full_name"]): p for p in tm_players}


def enrich_team(team: dict, stage1: dict, tm_players: list[dict]) -> dict:
    """
    Merge TM market values into the stage1 Wikipedia squad.
    Adds: market_value_eur, club_tm, league, in_top_league, top_player,
          tm_player_id, is_loan, parent_club, loan_club.
    """
    tm_index = _build_tm_index(tm_players)
    wiki_squad: list[dict] = stage1.get("squad", [])

    enriched: list[dict] = []
    for player in wiki_squad:
        p = dict(player)  # shallow copy

        # Match by normalized full name; fallback only when exactly one candidate
        # shares the last name (avoids grabbing the wrong player for common surnames).
        key = _normalize(p.get("full_name", ""))
        tm = tm_index.get(key)
        if not tm:
            last = key.split()[-1] if key else ""
            if last:
                candidates = [v for k, v in tm_index.items() if k.endswith(last)]
                tm = candidates[0] if len(candidates) == 1 else None

        if tm:
            p["market_value_eur"] = tm["market_value_eur"]
            p["club_tm"]          = tm["club_tm"]
            p["tm_player_id"]     = tm.get("tm_player_id")
            p["tm_player_slug"]   = tm.get("tm_player_slug")
        else:
            p["market_value_eur"] = None
            p["club_tm"]          = p.get("club", "")
            p["tm_player_id"]     = None
            p["tm_player_slug"]   = None

        # Loan status: fetch TM transfer history when we have a player ID
        tm_pid  = p.get("tm_player_id")
        tm_pslug = p.get("tm_player_slug")
        if tm_pid and tm_pslug:
            loan_info = scrape_tm_loan_status(tm_pslug, tm_pid)
        else:
            loan_info = None

        p["is_loan"]     = loan_info["is_loan"]     if loan_info else None
        p["parent_club"] = loan_info["parent_club"] if loan_info else None
        p["loan_club"]   = loan_info["loan_club"]   if loan_info else None

        # Determine league from Wikipedia club field first, TM club as fallback
        wiki_club = p.get("club", "")
        league = _get_club_league(wiki_club) or _get_club_league(p.get("club_tm", ""))
        p["league"]        = league
        p["in_top_league"] = league in TOP_LEAGUES if league else False

        enriched.append(p)

    # Mark top_player
    if team["spotlight"]:
        # Top 5 by market value are the "stars"
        sorted_by_value = sorted(
            [p for p in enriched if p["market_value_eur"]],
            key=lambda x: x["market_value_eur"],
            reverse=True,
        )
        top_ids = {id(p) for p in sorted_by_value[:5]}
        for p in enriched:
            p["top_player"] = id(p) in top_ids
    else:
        # Non-spotlight: top_player = plays in a top league
        for p in enriched:
            p["top_player"] = p["in_top_league"]

    total_value = sum(p["market_value_eur"] for p in enriched if p["market_value_eur"])

    return {
        "country":             team["country"],
        "flag":                team["flag"],
        "group":               team["group"],
        "confederation":       team["confederation"],
        "spotlight":           team["spotlight"],
        "squad":               enriched,
        "squad_total_value_eur": total_value,
        "history":             stage1.get("history", {}),
        "source_tm":           f"{_TM_BASE}/{team.get('tm_slug', '')}/kader/verein/{team.get('tm_id', '')}/saison_id/2026",
    }


def main() -> None:
    _OUTPUT.mkdir(exist_ok=True)
    succeeded, failed, skipped = [], [], []

    for team in TEAMS:
        slug = team["slug"]
        _logger.info("━━ Stage 2: %s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", team["country"])

        stage1_path = _OUTPUT / f"{slug}_stage1.json"
        if not stage1_path.exists():
            _logger.warning("%s: stage1 file missing — skipping", team["country"])
            skipped.append(team["country"])
            continue

        stage1 = json.loads(stage1_path.read_text(encoding="utf-8"))

        try:
            tm_players = scrape_tm_squad(team)
            result     = enrich_team(team, stage1, tm_players)
            out_path   = _OUTPUT / f"{slug}_stage2.json"
            out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            succeeded.append(team["country"])

            top = [p["full_name"] for p in result["squad"] if p.get("top_player")]
            _logger.info(
                "%s: total=€%s  top_players=%s",
                team["country"],
                f"{result['squad_total_value_eur']:,.0f}",
                ", ".join(top[:5]) or "none",
            )
        except Exception as exc:
            _logger.error("Unhandled error for %s: %s", team["country"], exc, exc_info=True)
            failed.append(team["country"])

    _logger.info("━━ STAGE 2 COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Succeeded : %d / %d", len(succeeded), len(TEAMS))
    if skipped:
        _logger.warning("Skipped   : %s", ", ".join(skipped))
    if failed:
        _logger.warning("Failed    : %s", ", ".join(failed))


if __name__ == "__main__":
    main()
