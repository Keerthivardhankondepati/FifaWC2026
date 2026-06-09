"""
Stage 1 — COLLECT
Primary squad data: Wikipedia 2026_FIFA_World_Cup_squads (single page, all 48 teams)
Squad validation + height/weight: ESPN /squad/ endpoint
Manager / formation: ESPN team page
World Cup history: Wikipedia national team page
Raw HTML saved to data/raw/ before any parsing.

Note: FBref was the original primary source but is blocked by Cloudflare.
      Wikipedia's WC squads page provides equivalent data (No., Pos., Player,
      DOB, Caps, Goals, Club) and is freely accessible.

Phase 4: Argentina only.
Phase 6: all 48 teams — replace run target in main.py.
"""

import re
import json
from datetime import date
from pathlib import Path
from bs4 import BeautifulSoup, Comment

from utils.http_client import get
from utils.logger import get_logger
from teams_config import TEAMS

_logger = get_logger("kickoff26.stage1")
_RAW_DIR = Path(__file__).parent / "data" / "raw"
_TOURNAMENT_START = date(2026, 6, 11)

_WIKI_SQUADS_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"
_wiki_squads_soup: BeautifulSoup | None = None

_ESPN_POS_MAP = {"G": "GK", "D": "DF", "M": "MF", "F": "FW"}

# Teams whose names differ between teams_config and Wikipedia's WC squads page headings
_WIKI_NAME_OVERRIDES: dict[str, str] = {
    "Czechia":  "Czech Republic",
    "Türkiye":  "Turkey",
}


# ── registry ──────────────────────────────────────────────────────────────────

def scrape_team_list() -> list[dict]:
    return list(TEAMS)


# ── raw persistence ───────────────────────────────────────────────────────────

def save_raw(team: dict, source: str, data: str | dict) -> Path:
    out_dir = _RAW_DIR / source
    out_dir.mkdir(parents=True, exist_ok=True)
    if isinstance(data, dict):
        path = out_dir / f"{team['slug']}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        path = out_dir / f"{team['slug']}.html"
        path.write_text(data, encoding="utf-8")
    return path


# ── shared helpers ────────────────────────────────────────────────────────────

def _age_at_tournament(dob_str: str) -> int | None:
    try:
        dob = date.fromisoformat(dob_str)
        t = _TOURNAMENT_START
        return t.year - dob.year - ((t.month, t.day) < (dob.month, dob.day))
    except (ValueError, TypeError):
        return None


def _int_or_none(value: str) -> int | None:
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_wiki_dob(cell_text: str) -> str | None:
    """Extract ISO date from Wikipedia DOB format: '(1994-05-06)May 6, 1994 (aged 32)'"""
    m = re.search(r"\((\d{4}-\d{2}-\d{2})\)", cell_text)
    return m.group(1) if m else None


def _normalize_wiki_pos(raw: str) -> str:
    """Wikipedia positions can be '1GK', '2DF' etc. Strip the leading digit."""
    return re.sub(r"^\d+", "", raw).strip()


# ── Wikipedia WC squads (primary squad source) ────────────────────────────────

def _get_wiki_squads_soup() -> BeautifulSoup | None:
    """Fetch the WC squads page once and cache it for the full pipeline run."""
    global _wiki_squads_soup
    if _wiki_squads_soup is not None:
        return _wiki_squads_soup

    response = get(_WIKI_SQUADS_URL)
    if not response:
        _logger.error("Failed to fetch Wikipedia WC squads page — all squad scrapes will fail")
        return None

    raw_path = _RAW_DIR / "wikipedia"
    raw_path.mkdir(parents=True, exist_ok=True)
    (raw_path / "wc_squads.html").write_text(response.text, encoding="utf-8")

    _wiki_squads_soup = BeautifulSoup(response.text, "lxml")
    _logger.info("Wikipedia WC squads page fetched and cached")
    return _wiki_squads_soup


def scrape_wiki_squad(team: dict) -> list[dict]:
    """
    Primary squad source. Extracts a team's squad from the cached WC squads page.
    Columns: No., Pos., Player, DOB, Caps, Goals, Club.
    """
    soup = _get_wiki_squads_soup()
    if not soup:
        return []

    country = _WIKI_NAME_OVERRIDES.get(team["country"], team["country"])
    heading = next(
        (h for h in soup.find_all(["h2", "h3"])
         if country.lower() in h.get_text().lower()),
        None,
    )
    if not heading:
        _logger.warning("%s: section not found on Wikipedia WC squads page", country)
        return []

    table = heading.find_next("table")
    if not table:
        _logger.warning("%s: squad table not found after heading", country)
        return []

    players = []
    for row in table.find_all("tr")[1:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 7:
            continue

        squad_number = _int_or_none(cells[0].get_text(strip=True))
        position     = _normalize_wiki_pos(cells[1].get_text(strip=True))
        full_name    = cells[2].get_text(strip=True)
        dob          = _parse_wiki_dob(cells[3].get_text(strip=True))
        caps         = _int_or_none(cells[4].get_text(strip=True))
        goals        = _int_or_none(cells[5].get_text(strip=True))
        club         = cells[6].get_text(strip=True)

        if not full_name:
            continue

        players.append({
            "player_id":           f"{team['slug']}_{squad_number}" if squad_number else None,
            "country":             team["country"],
            "full_name":           full_name,
            "squad_number":        squad_number,
            "position":            position,
            "club":                club,
            "date_of_birth":       dob,
            "age":                 _age_at_tournament(dob) if dob else None,
            "caps":                caps,
            "international_goals": goals,
            "source_url_primary":  _WIKI_SQUADS_URL,
        })

    _logger.info("%s: Wikipedia squads — %d players", country, len(players))
    return players


# ── ESPN squad + team (validation + manager/formation) ───────────────────────

def scrape_espn_squad(team: dict) -> dict:
    """
    Fetches ESPN squad page for player list (name, number, position, age, height, weight).
    Also fetches ESPN team page for manager and formation.
    Returns a dict with keys: espn_squad, manager, formation, source_url_espn.
    """
    if not team.get("espn_id"):
        _logger.warning(
            "%s: espn_id not set — find on espn.com/soccer and set in teams_config.py",
            team["country"],
        )
        return {}

    result: dict = {}

    # ── squad page ────────────────────────────────────────────────────────────
    squad_url = f"https://www.espn.com/soccer/team/squad/_/id/{team['espn_id']}"
    squad_response = get(squad_url)
    if squad_response:
        save_raw(team, "espn", squad_response.text)
        result["source_url_espn"] = squad_url
        soup = BeautifulSoup(squad_response.text, "lxml")

        espn_squad = []
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:]:
                cells = row.find_all(["td", "th"])
                if len(cells) < 3:
                    continue

                name_raw = cells[0].get_text(strip=True)
                # ESPN appends squad number to name: "Juan Musso1"
                number_match = re.search(r"(\d+)$", name_raw)
                if number_match:
                    squad_number = int(number_match.group(1))
                    full_name = name_raw[: number_match.start()].strip()
                else:
                    squad_number = None
                    full_name = name_raw

                if not full_name:
                    continue

                pos_raw = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                espn_squad.append({
                    "full_name":    full_name,
                    "squad_number": squad_number,
                    "position":     _ESPN_POS_MAP.get(pos_raw, pos_raw),
                    "age":          _int_or_none(cells[2].get_text(strip=True)) if len(cells) > 2 else None,
                    "height":       cells[3].get_text(strip=True) if len(cells) > 3 else None,
                    "weight":       cells[4].get_text(strip=True) if len(cells) > 4 else None,
                })

        result["espn_squad"] = espn_squad
        _logger.info("%s: ESPN squad — %d players", team["country"], len(espn_squad))
    else:
        _logger.error("%s: ESPN squad request failed — %s", team["country"], squad_url)

    # ── team page (manager + formation) ──────────────────────────────────────
    team_url = f"https://www.espn.com/soccer/team/_/id/{team['espn_id']}"
    team_response = get(team_url)
    if team_response:
        team_soup = BeautifulSoup(team_response.text, "lxml")

        coach_label = team_soup.find(string=re.compile(r"Head Coach|Manager", re.I))
        if coach_label:
            name_tag = coach_label.find_next(["a", "span"])
            if name_tag:
                result["manager"] = name_tag.get_text(strip=True)

        formation_match = re.search(r"\b(\d-\d-\d(?:-\d)?)\b", team_soup.get_text())
        if formation_match:
            result["formation"] = formation_match.group(1)

        _logger.info("%s: ESPN team — manager=%s  formation=%s",
                     team["country"], result.get("manager"), result.get("formation"))

    return result


# ── Wikipedia national team page (WC history) ────────────────────────────────

def scrape_wiki_history(team: dict) -> dict:
    """Scrape World Cup history from the national team's Wikipedia page."""
    wiki_slug = team.get("wiki_slug")
    if not wiki_slug:
        _logger.warning("%s: wiki_slug not set — skipping Wikipedia history", team["country"])
        return {}

    url = f"https://en.wikipedia.org/wiki/{wiki_slug}"
    response = get(url)
    if not response:
        _logger.error("%s: Wikipedia history request failed — %s", team["country"], url)
        return {}

    save_raw(team, "wikipedia", response.text)
    soup = BeautifulSoup(response.text, "lxml")
    result: dict = {"source_url_wiki": url}

    infobox = soup.find("table", class_=re.compile(r"infobox"))
    if infobox:
        appearances_seen = 0
        best_result_seen = 0
        for row in infobox.find_all("tr"):
            th = row.find("th")
            td = row.find("td")
            if not th or not td:
                continue
            label = th.get_text(strip=True).lower()
            value = td.get_text(separator=" ", strip=True)

            # Manager — infobox label is "Head coach" or "Manager"
            if "head coach" in label or (label == "manager"):
                # Strip Wikipedia citation markers like "[ 4 ] [ 5 ]"
                result["manager"] = re.sub(r"\s*\[\s*\d+\s*\]", "", value).strip()

            # First "Appearances" row in the infobox is always the World Cup entry.
            # Format: "19 ( first in 1930 )"
            elif label == "appearances" and appearances_seen == 0:
                appearances_seen += 1
                m = re.search(r"(\d+)", value)
                if m:
                    result["wc_appearances"] = int(m.group(1))
                debut_m = re.search(r"first\s+in\s+(\d{4})", value, re.I)
                if debut_m:
                    result["wc_debut_year"] = int(debut_m.group(1))

            # First "Best result" row is also the World Cup entry
            elif ("best result" in label or "best finish" in label) and best_result_seen == 0:
                best_result_seen += 1
                result["wc_best_finish"] = value.split("(")[0].strip()

    content = soup.find("div", id="mw-content-text")
    if content:
        lead = content.find("p")
        if lead:
            text = lead.get_text(strip=True)
            first_sentence = text.split(".")[0]
            if len(first_sentence) > 20:
                result["wc_history_notes"] = first_sentence + "."

    _logger.info("%s: Wikipedia history — appearances=%s  best=%s  debut=%s",
                 team["country"],
                 result.get("wc_appearances"),
                 result.get("wc_best_finish"),
                 result.get("wc_debut_year"))
    return result
