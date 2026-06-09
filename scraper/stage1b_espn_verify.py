"""
Stage 1b — ESPN Squad Verification
Scrapes ESPN squad pages for all 48 teams and cross-references against
our stage4 data. Produces a report of:
  - Players only in ESPN  (possibly new additions to the official WC squad)
  - Players only in stage4 (possibly dropped / not in ESPN's WC list)
  - Field differences     (position, squad number)
  - Height / weight data  (added to output for stage5 use)

Results written to:
  output/espn_verify/report.json   — machine-readable diff per team
  output/espn_verify/report.txt    — human-readable summary

Run:
  cd scraper
  python stage1b_espn_verify.py
"""

import json
import re
import time
import unicodedata
from pathlib import Path

from bs4 import BeautifulSoup

from teams_config import TEAMS
from utils.http_client import get
from utils.logger import get_logger

_logger = get_logger("kickoff26.stage1b")
_OUTPUT   = Path(__file__).parent / "output"
_VERIFY   = _OUTPUT / "espn_verify"
_RAW_DIR  = Path(__file__).parent / "data" / "raw" / "espn"
_DELAY    = 2.5   # seconds between ESPN requests

_ESPN_POS_MAP = {"G": "GK", "D": "DF", "M": "MF", "F": "FW"}


# ── name normalisation ─────────────────────────────────────────────────────────

_CHAR_SUBS = str.maketrans({
    'ø': 'o', 'Ø': 'o', 'æ': 'ae', 'Æ': 'ae', 'ß': 'ss',
    'ł': 'l', 'Ł': 'l', 'ð': 'd', 'þ': 'th',
})

def _norm_name(name: str) -> str:
    """Lowercase, strip accents, remove punctuation, collapse spaces."""
    if not name:
        return ""
    s = name.lower().translate(_CHAR_SUBS)
    nfkd = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in nfkd if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return " ".join(s.split())


def _name_similarity(a: str, b: str) -> float:
    """Token-overlap similarity between two normalised names (0.0–1.0)."""
    ta, tb = set(_norm_name(a).split()), set(_norm_name(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(len(ta), len(tb))


def _best_match(espn_name: str, stage4_names: list[str], threshold: float = 0.5):
    """Return (best_stage4_name, score) or (None, 0) if below threshold."""
    best, best_score = None, 0.0
    for s4n in stage4_names:
        score = _name_similarity(espn_name, s4n)
        if score > best_score:
            best, best_score = s4n, score
    return (best, best_score) if best_score >= threshold else (None, 0.0)


# ── ESPN scraping ──────────────────────────────────────────────────────────────

def _fetch_espn_squad(team: dict) -> list[dict]:
    espn_id = team.get("espn_id")
    if not espn_id:
        return []

    slug = team["slug"]
    cache = _RAW_DIR / f"{slug}.html"

    if cache.exists():
        _logger.info("%s: ESPN squad — using cached HTML", team["country"])
        html = cache.read_text(encoding="utf-8")
    else:
        url = f"https://www.espn.com/soccer/team/squad/_/id/{espn_id}"
        _logger.info("%s: fetching ESPN squad — %s", team["country"], url)
        resp = get(url)
        if not resp:
            _logger.error("%s: ESPN request failed", team["country"])
            return []
        html = resp.text
        _RAW_DIR.mkdir(parents=True, exist_ok=True)
        cache.write_text(html, encoding="utf-8")
        time.sleep(_DELAY)

    soup = BeautifulSoup(html, "lxml")
    players = []

    for table in soup.find_all("table"):
        for row in table.find_all("tr")[1:]:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            name_raw = cells[0].get_text(strip=True)
            # ESPN appends squad number to name: "Juan Musso1"
            num_match = re.search(r"(\d+)$", name_raw)
            if num_match:
                squad_number = int(num_match.group(1))
                full_name = name_raw[: num_match.start()].strip()
            else:
                squad_number = None
                full_name = name_raw

            if not full_name:
                continue

            pos_raw = cells[1].get_text(strip=True) if len(cells) > 1 else ""
            age     = _int_or_none(cells[2].get_text(strip=True)) if len(cells) > 2 else None
            height  = cells[3].get_text(strip=True) if len(cells) > 3 else None
            weight  = cells[4].get_text(strip=True) if len(cells) > 4 else None

            players.append({
                "full_name":    full_name,
                "squad_number": squad_number,
                "position":     _ESPN_POS_MAP.get(pos_raw, pos_raw),
                "age":          age,
                "height":       height or None,
                "weight":       weight or None,
            })

    return players


def _int_or_none(s: str):
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


# ── comparison ─────────────────────────────────────────────────────────────────

def _compare(team: dict, espn_players: list[dict], stage4_squad: list[dict]) -> dict:
    """Cross-reference ESPN vs stage4 for one team. Returns diff dict."""
    s4_names = [p["full_name"] for p in stage4_squad]
    s4_by_name = {p["full_name"]: p for p in stage4_squad}

    matched   = []   # ESPN player matched to stage4 player
    only_espn = []   # In ESPN, no match in stage4
    diffs     = []   # Matched but field differences
    espn_matched_s4 = set()

    for ep in espn_players:
        best_s4, score = _best_match(ep["full_name"], s4_names)
        if best_s4:
            espn_matched_s4.add(best_s4)
            s4p = s4_by_name[best_s4]
            field_diffs = {}

            # Position difference
            if ep["position"] and s4p.get("position") and ep["position"] != s4p["position"]:
                field_diffs["position"] = {"espn": ep["position"], "stage4": s4p["position"]}

            # Squad number difference
            if ep["squad_number"] and s4p.get("squad_number") and ep["squad_number"] != s4p["squad_number"]:
                field_diffs["squad_number"] = {"espn": ep["squad_number"], "stage4": s4p["squad_number"]}

            matched.append({
                "espn_name":  ep["full_name"],
                "stage4_name": best_s4,
                "match_score": round(score, 2),
                "height":     ep.get("height"),
                "weight":     ep.get("weight"),
                "diffs":      field_diffs,
            })
            if field_diffs:
                diffs.append(matched[-1])
        else:
            only_espn.append(ep["full_name"])

    only_stage4 = [n for n in s4_names if n not in espn_matched_s4]

    return {
        "country":       team["country"],
        "espn_count":    len(espn_players),
        "stage4_count":  len(stage4_squad),
        "matched":       len(matched),
        "only_espn":     only_espn,
        "only_stage4":   only_stage4,
        "field_diffs":   diffs,
        "players":       matched,
    }


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    _VERIFY.mkdir(parents=True, exist_ok=True)

    all_results = []
    summary_lines = []

    for team in TEAMS:
        slug = team["slug"]
        country = team["country"]

        stage4_path = _OUTPUT / f"{slug}_stage4.json"
        if not stage4_path.exists():
            _logger.warning("%s: stage4 file missing — skipping", country)
            continue

        stage4 = json.loads(stage4_path.read_text(encoding="utf-8"))
        stage4_squad = stage4.get("squad", [])

        espn_players = _fetch_espn_squad(team)

        if not espn_players:
            _logger.warning("%s: ESPN returned 0 players", country)
            summary_lines.append(f"[{country}] ESPN: 0 players (fetch failed or empty)")
            continue

        result = _compare(team, espn_players, stage4_squad)
        all_results.append(result)

        only_e = result["only_espn"]
        only_s = result["only_stage4"]
        diffs  = result["field_diffs"]

        status_parts = [
            f"ESPN:{result['espn_count']}  stage4:{result['stage4_count']}  matched:{result['matched']}"
        ]
        if only_e:
            status_parts.append(f"only-in-ESPN:{len(only_e)}")
        if only_s:
            status_parts.append(f"only-in-stage4:{len(only_s)}")
        if diffs:
            status_parts.append(f"field-diffs:{len(diffs)}")

        line = f"[{country}]  " + "  ".join(status_parts)
        summary_lines.append(line)
        _logger.info(line)

        if only_e:
            for n in only_e:
                summary_lines.append(f"  + ESPN only: {n}")
        if only_s:
            for n in only_s:
                summary_lines.append(f"  - stage4 only: {n}")
        if diffs:
            for d in diffs:
                for field, vals in d["diffs"].items():
                    summary_lines.append(
                        f"  ~ {d['stage4_name']}: {field} ESPN={vals['espn']} stage4={vals['stage4']}"
                    )

    # Write report
    report_json = _VERIFY / "report.json"
    report_json.write_text(json.dumps(all_results, ensure_ascii=False, indent=2), encoding="utf-8")

    report_txt = _VERIFY / "report.txt"
    report_txt.write_text("\n".join(summary_lines), encoding="utf-8")

    _logger.info("━━ STAGE 1b COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    _logger.info("Report: %s", report_txt)
    _logger.info("Processed %d teams", len(all_results))


if __name__ == "__main__":
    main()
