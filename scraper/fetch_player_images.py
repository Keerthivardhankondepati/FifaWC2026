#!/usr/bin/env python3
"""
fetch_player_images.py
======================
Fetch Wikipedia portrait images for every marquee player in the
"Players to Watch" section, then patch main.js and styles.css so the
player cards show the real photo with initials as a fallback.

Usage:
    python scraper/fetch_player_images.py

Re-running is safe: already-downloaded images are skipped and the
source-file patches are idempotent.
"""

import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT  = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "website" / "images" / "players"
MAIN_JS    = REPO_ROOT / "website" / "js" / "main.js"
STYLES_CSS = REPO_ROOT / "website" / "css" / "styles.css"
SOFASCORE  = Path(__file__).resolve().parent / "data" / "raw" / "sofascore"

DELAY      = 1.0   # seconds between Wikipedia requests
THUMB_SIZE = 800   # requested thumbnail width (px) — action API

# ── Player list ────────────────────────────────────────────────────────────────
# (display_name_matching_main_js, country_slug_for_sofascore_file)
PLAYERS = [
    # Tier 1 – The Stars
    ("Kylian Mbappé",     "france"),
    ("Erling Haaland",    "norway"),
    ("Vinicius Jr",       "brazil"),
    ("Jude Bellingham",   "england"),
    ("Lamine Yamal",      "spain"),
    ("Federico Valverde", "uruguay"),
    ("Ousmane Dembélé",   "france"),
    ("Bruno Fernandes",   "portugal"),
    ("Declan Rice",       "england"),
    ("Raphinha",          "brazil"),
    ("Pedri",             "spain"),
    ("Julián Álvarez",    "argentina"),
    ("Rodri",             "spain"),
    # Tier 2 – The Legends
    ("Lionel Messi",      "argentina"),
    ("Cristiano Ronaldo", "portugal"),
    ("Luka Modrić",       "croatia"),
    ("Mohamed Salah",     "egypt"),
    ("Virgil van Dijk",   "netherlands"),
    ("Thibaut Courtois",  "belgium"),
    ("Sadio Mané",        "senegal"),
    ("Edin Džeko",        "bosnia-and-herzegovina"),
    ("Guillermo Ochoa",   "mexico"),
    ("Neymar Jr",         "brazil"),
    # Tier 3 – The Ones to Watch
    ("Florian Wirtz",     "germany"),
    ("Jamal Musiala",     "germany"),
    ("Nico Paz",          "argentina"),
    ("Scott McTominay",   "scotland"),
    ("Viktor Gyökeres",   "sweden"),
    ("Désiré Doué",       "france"),
    ("Vitinha",           "portugal"),
    ("Michael Olise",     "france"),
    ("Achraf Hakimi",     "morocco"),
    ("Rúben Dias",        "portugal"),
    ("Bukayo Saka",       "england"),
    ("Gavi",              "spain"),
    ("Antoine Semenyo",   "ghana"),
    ("Christian Pulisic", "united-states"),
]

# Wikipedia article title overrides (where the display name differs from the article)
WIKI_OVERRIDES = {
    "Vinicius Jr":       "Vinícius Júnior",
    "Neymar Jr":         "Neymar",
    "Rodri":             "Rodrigo Hernández Cascante",
    "Gavi":              "Gavi (footballer)",
    # "Raphinha" and "Pedri" resolve correctly without disambiguation
}

HEADERS = {
    "User-Agent": (
        "kickoff26/1.0 (https://github.com/Keerthivardhankondepati/FifaWC2026;"
        " educational/informational project; contact via GitHub Issues)"
    )
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    """'Kylian Mbappé' → 'kylian-mbappe'  (must match playerSlug() in main.js)"""
    nfkd = unicodedata.normalize("NFD", name)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_str.lower()).strip("-")


def get_sofascore_id(player_name: str, country_slug: str) -> int | None:
    """Return the player's SofaScore numeric ID from the raw squad JSON, or None."""
    path = SOFASCORE / f"{country_slug}.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        for entry in data.get("players", []):
            p = entry.get("player", {})
            if p.get("name", "").lower() == player_name.lower():
                return p.get("id")
    except Exception:
        pass
    return None


def upsize_wiki_thumb(url: str, target_width: int = THUMB_SIZE) -> str:
    """Rewrite a Wikipedia thumbnail URL to request a larger size."""
    return re.sub(r"/\d+px-", f"/{target_width}px-", url)


def fetch_wiki_image_url(player_name: str) -> str | None:
    """
    Return an image URL from Wikipedia for player_name, or None.
    Priority: REST originalimage (full res) → upsized REST thumbnail → action API.
    """
    title   = WIKI_OVERRIDES.get(player_name, player_name)
    encoded = urllib.parse.quote(title.replace(" ", "_"))

    # 1) REST summary API — prefer originalimage (full resolution)
    rest_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
    try:
        req = urllib.request.Request(rest_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read())
        if "originalimage" in data:
            orig = data["originalimage"]["source"]
            w    = data["originalimage"].get("width", 0)
            # If original is reasonably sized, use it; otherwise fall to action API
            if w <= 2000:
                return orig
        # No usable originalimage — fall through to action API for proper size handling
    except Exception as exc:
        print(f"        REST summary failed ({exc}), trying action API…")

    # 2) Action API pageimages — broader fallback with explicit size
    action_url = (
        "https://en.wikipedia.org/w/api.php?action=query"
        f"&titles={encoded}&prop=pageimages&pithumbsize={THUMB_SIZE}"
        "&format=json&pilicense=any"
    )
    try:
        req = urllib.request.Request(action_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read())
        pages = data["query"]["pages"]
        page  = next(iter(pages.values()))
        src   = page.get("thumbnail", {}).get("source")
        if src:
            return src
    except Exception as exc:
        print(f"        Action API failed ({exc})")

    return None


def download_image(url: str, dest: Path) -> bool:
    """Download url → dest. Returns True on success, False on error."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            dest.write_bytes(resp.read())
        return True
    except Exception as exc:
        print(f"        Download error: {exc}")
        return False


# ── main.js patch ──────────────────────────────────────────────────────────────

# playerSlug() mirrors the Python slugify() exactly so filenames match.
# The \\u inside the triple-quoted string writes a literal \u to the .js file,
# which JavaScript then interprets as a Unicode escape.
_SLUG_FN = """
function playerSlug(name) {
  return name.normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
"""

def patch_main_js() -> None:
    text = MAIN_JS.read_text(encoding="utf-8")

    if "playerSlug" in text:
        print("  main.js: playerSlug already present — skipping.")
        return

    # ── 1) Insert playerSlug() helper just before posLabel() ──────────────────
    if "\nfunction posLabel(pos) {" not in text:
        print("  main.js: WARNING — posLabel anchor not found; skipping patch.")
        return
    text = text.replace(
        "\nfunction posLabel(pos) {",
        _SLUG_FN + "\nfunction posLabel(pos) {"
    )

    # ── 2) Swap the player-photo inner content ─────────────────────────────────
    # Matches (across the newlines between elements):
    #   <div class="player-photo" style="background:${bg}">
    #     <span>${esc(p.init)}</span>
    #   </div>
    photo_pattern = (
        r'(<div class="player-photo" style="background:\$\{bg\}">)'
        r'\s*<span>\$\{esc\(p\.init\)\}</span>'
        r'\s*(</div>)'
    )

    def photo_replacement(m: re.Match) -> str:
        open_div  = m.group(1)   # <div class="player-photo"...>  (no leading ws)
        close_div = m.group(2)   # </div>                         (no leading ws)
        # fmt: off
        return (
            open_div                                                            + "\n"
            '            <img src="images/players/${playerSlug(p.name)}.jpg"\n'
            '                 alt="${esc(p.name)}"\n'
            "                 onerror=\"this.style.display='none';"
                "this.nextElementSibling.style.display='flex'\">\n"
            '            <div class="player-initials"'
                ' style="display:none">${esc(p.init)}</div>\n'
            "          " + close_div
        )
        # fmt: on

    new_text, n = re.subn(photo_pattern, photo_replacement, text, flags=re.DOTALL)
    if n:
        print(f"  main.js: patched player-photo block ({n} occurrence).")
        MAIN_JS.write_text(new_text, encoding="utf-8")
        print("  main.js: saved.")
    else:
        print("  main.js: WARNING — player-photo pattern not found; skipping.")


# ── styles.css patch ──────────────────────────────────────────────────────────

_CSS_PATCH = """
/* ─── Player initials fallback (shown when photo fails to load) ─────────── */
.player-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: 800;
  font-size: 1.1rem;
  color: #fff;
}
"""

def patch_styles() -> None:
    text = STYLES_CSS.read_text(encoding="utf-8")
    if "player-initials" in text:
        print("  styles.css: .player-initials already present — skipping.")
        return
    STYLES_CSS.write_text(text + _CSS_PATCH, encoding="utf-8")
    print("  styles.css: added .player-initials rule.")


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> int:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Image directory : {IMAGES_DIR}")
    print(f"Players to fetch: {len(PLAYERS)}")
    print("─" * 62)

    ok_count   = 0
    fail_count = 0
    skip_count = 0

    for player_name, country_slug in PLAYERS:
        slug = slugify(player_name)
        dest = IMAGES_DIR / f"{slug}.jpg"

        # ── Already downloaded ─────────────────────────────────────────────────
        if dest.exists():
            size_kb = dest.stat().st_size // 1024
            print(f"[SKIP]  {player_name:<30}  {slug}.jpg  ({size_kb} KB)")
            skip_count += 1
            continue

        print(f"[FETCH] {player_name:<30}  →  {slug}.jpg")

        # Log SofaScore ID if resolvable
        sid = get_sofascore_id(player_name, country_slug)
        if sid:
            print(f"        SofaScore ID : {sid}")

        # Fetch image URL from Wikipedia
        img_url = fetch_wiki_image_url(player_name)
        if not img_url:
            print(f"        [FAIL]  no image found on Wikipedia")
            fail_count += 1
            time.sleep(DELAY)
            continue

        print(f"        URL          : {img_url[:80]}{'…' if len(img_url) > 80 else ''}")

        ok = download_image(img_url, dest)
        if ok:
            size_kb = dest.stat().st_size // 1024
            print(f"        [OK]   {size_kb} KB saved")
            ok_count += 1
        else:
            fail_count += 1
            if dest.exists():
                dest.unlink()  # remove partial download

        time.sleep(DELAY)

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "─" * 62)
    print(f"Downloaded : {ok_count}")
    print(f"Skipped    : {skip_count}  (already on disk)")
    print(f"Failed     : {fail_count}")

    if fail_count:
        print("\nFailed players (no image found or download error):")
        for name, _ in PLAYERS:
            if not (IMAGES_DIR / f"{slugify(name)}.jpg").exists():
                print(f"  {name}")

    # ── Patch source files ─────────────────────────────────────────────────────
    print("\nPatching source files…")
    patch_main_js()
    patch_styles()
    print("Done.")

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
