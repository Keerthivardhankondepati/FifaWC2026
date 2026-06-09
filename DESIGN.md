
# kickoff26 — FIFA World Cup 2026 Starter Guide
## Design Document v2.0
Last updated: June 2026

---

## 1. Project Overview

kickoff26 is a beginner-friendly FIFA World Cup 2026 guide website.
It is designed for people who are new to football/soccer and want to
understand the tournament, the teams, and the players before and
during the event.

The final product is a mobile and desktop responsive website that covers:
- All 48 teams competing in the 2026 World Cup
- Deep-dive spotlight cards for the top 31 teams
- Full squad details for every team
- Each team's potential knockout road
- A beginner's glossary of football terms
- Built by Keerthi — hosted on GitHub Pages

Tournament dates: June 11 – July 19, 2026
Host nations: United States, Canada, Mexico
Final venue: MetLife Stadium, East Rutherford, New Jersey

---

## 2. Project Goals

- Give football beginners enough context to enjoy every match
- Cover all 48 teams with at minimum a compact card
- Provide deep-dive spotlight content for the top 31 contender teams
- Show each team's potential path through the knockout bracket
- Be accurate — all data sourced and verified, never guessed
- Be shareable — a clean URL anyone can open on their phone

---

## 3. Folder Structure

```
kickoff26/
├── DESIGN.md                        ← this file
├── README.md                        ← project description
├── scraper/                         ← Python data pipeline
│   ├── data/
│   │   └── raw/
│   │       └── transfermarkt/       ← cached squad HTML per team
│   │           └── loan_history/    ← cached transfer history HTML per player
│   ├── output/
│   │   ├── {slug}_stage1.json       ← Wikipedia squad data (48 files)
│   │   ├── {slug}_stage2.json       ← + TM market values and loan status
│   │   ├── {slug}_stage3.json       ← + SofaScore player IDs and clubs
│   │   ├── {slug}_stage4.json       ← + conflict flags and confidence scores
│   │   └── export/                  ← stage5 final output (Phase 11)
│   │       ├── team_reviews.json
│   │       ├── teams.csv
│   │       └── players.csv
│   ├── utils/
│   │   ├── http_client.py           ← shared session, rate limiting, retry
│   │   ├── name_matcher.py          ← fuzzy player name matching
│   │   └── logger.py               ← centralised logging
│   ├── stage1_collect.py            ← Wikipedia squad scraper
│   ├── stage2_enrich.py             ← Transfermarkt market values + loans
│   ├── stage3_sofascore.py          ← SofaScore player matching
│   ├── stage4_score.py              ← conflict detection + confidence scoring
│   ├── stage5_export.py             ← final export (Phase 11 — next)
│   ├── teams_config.py              ← all 48 teams: group, flag, source IDs
│   ├── requirements.txt
│   └── logs/
├── website/                         ← frontend (Phase 13)
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── data/
│       └── teams.js                 ← generated from team_reviews.json
```

---

## 4. Data Pipeline

### 4.1 Architecture Overview

The pipeline runs in 4 sequential stages. Each stage reads the previous
stage's output and writes its own enriched file. If a stage fails for one
team, it logs the error and continues. All raw HTML responses are cached in
data/raw/ for audit and re-processing without re-fetching.

```
Stage 1  COLLECT     Wikipedia squad page → {slug}_stage1.json
Stage 2  ENRICH TM   Transfermarkt squad + transfer history → {slug}_stage2.json
Stage 3  ENRICH SOFA SofaScore national team page → {slug}_stage3.json
Stage 4  SCORE       Conflict detection + confidence scoring → {slug}_stage4.json
Stage 5  EXPORT      Generate website-ready output files (Phase 11 — next)
```

Note: FBref and ESPN were evaluated during planning but not used in the final
implementation. Wikipedia provides sufficient squad accuracy; FBref was ruled
out due to robots.txt restrictions.


### 4.2 Source Priority and Responsibility

| Priority | Source       | Type                      | Provides                                      |
|----------|-------------|---------------------------|-----------------------------------------------|
| 1        | Wikipedia    | HTML (BeautifulSoup)      | Squad list, club, position, caps, goals, DOB  |
| 2        | Transfermarkt| HTML (BeautifulSoup)      | Market value, loan status, TM player ID       |
| 3        | SofaScore    | HTML (BeautifulSoup)      | SofaScore player ID, sofa club, sofa league   |

If a source is unavailable, affected fields are set to null — never guessed.
Each source's raw HTML is cached locally so re-runs do not re-fetch.


### 4.3 Data Fields Per Player (stage4 output)

Wikipedia fields (stage1):
  full_name            official name from Wikipedia squad table
  position             GK / DF / MF / FW
  club                 current club as listed on Wikipedia
  date_of_birth        YYYY-MM-DD
  age                  calculated as of June 11 2026 (tournament start)
  caps                 total international appearances
  international_goals  goals scored for national team
  in_top_league        bool — club plays in one of the 6 elite leagues

Transfermarkt fields (stage2):
  tm_player_id         Transfermarkt internal player ID
  market_value_eur     integer in euros, e.g. 120000000
  market_value_fmt     formatted string e.g. "€120m"
  is_loan              bool or null (null = could not determine)
  parent_club          owning club when on loan, else null
  loan_club            destination club when on loan, else null

SofaScore fields (stage3):
  sofa_player_id       SofaScore internal player ID
  sofa_club            club name as listed on SofaScore
  sofa_league          league name as listed on SofaScore

Quality fields (stage4):
  club_conflict        true when Wikipedia club ≠ SofaScore club
  in_top_league        resolved value — best available source (see 4.5)
  in_top_league_conflict  always false — all cases resolved in stage4
  data_sources         list: ["wikipedia"], or + "transfermarkt", "sofascore"
  confidence           0–100 score based on source coverage


### 4.4 Data Fields Per Team (stage4 output)

  country              full country name
  flag_emoji           emoji flag character
  group                A through L
  confederation        UEFA / CONMEBOL / CAF / AFC / CONCACAF / OFC
  wc_appearances       total World Cup appearances (Wikipedia)
  wc_best_finish       best ever result (Wikipedia)
  avg_confidence       mean confidence score across squad
  players_with_sofa    count of players matched in SofaScore
  players_with_tm      count of players with TM market value
  players_all_sources  count matched by all 3 sources
  data_completeness_pct  % of squad with confidence >= 75
  squad                array of player objects (see 4.3)


### 4.5 in_top_league Resolution

The `in_top_league` flag is resolved in stage4 using a verified lookup of
2025-26 season final standings. Neither Wikipedia nor SofaScore alone is
reliable — Wikipedia can be stale for promoted/relegated clubs, and SofaScore
stores the league from the player's last international appearance which may be
from a prior season.

Resolution priority:
  1. _CLUB_LEAGUE_OVERRIDES dict (ground truth, verified June 2026)
  2. Youth/reserve match detected → use Wikipedia value
  3. SofaScore league recognised as top tier → True
  4. Wikipedia value as fallback

Elite leagues (top tier):
  Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, Saudi Pro League


### 4.6 Conflict Detection

club_conflict: true when Wikipedia club ≠ SofaScore club (after normalization).
  Typical cause: transfer during the season where one source lags behind.
  Final count: 2 genuine conflicts across all 48 teams.

in_top_league_conflict: always false after stage4 resolution (see 4.5).
  Previously showed 84 false conflicts due to stale league data — all resolved.


### 4.7 Confidence Scoring

  100   Wikipedia + Transfermarkt + SofaScore all matched
   75   Wikipedia + Transfermarkt matched, SofaScore missing
   75   Wikipedia + SofaScore matched, TM missing
   50   Wikipedia only matched
   penalty -15 for club_conflict
   penalty  -5 for no caps data

Players below 75 are counted as incomplete in data_completeness_pct.


### 4.8 Rate Limiting and Ethics

Every domain checked against robots.txt before first request.
Robots.txt rules are never bypassed.

Minimum delays between requests:
  transfermarkt.com   3 seconds
  sofascore.com       2 seconds
  en.wikipedia.org    1 second (explicitly permits bots)

Retry logic:
  Maximum retries     3 per request
  Backoff schedule    2s → 4s → 8s (exponential)
  On final failure    log error, mark source unavailable, continue

HTML caching:
  All squad pages and transfer history pages saved to data/raw/
  Re-runs use cached HTML — no redundant fetches


### 4.9 Stage 5 Export Output Files

stage5_export.py generates the following files from the 48 stage4 JSON files:

team_reviews.json
  One JSON object per team. Used by the website JS to render all team cards.
  Structure:
  {
    "country": "Argentina",
    "flag_emoji": "🇦🇷",
    "group": "J",
    "confederation": "CONMEBOL",
    "spotlight": true,
    "wc_appearances": 18,
    "wc_best_finish": "Winner",
    "avg_confidence": 98.0,
    "data_completeness_pct": 96.0,
    "players_with_sofa": 25,
    "players_with_tm": 25,
    "story": "",            ← filled manually for spotlight teams
    "fun_fact": "",         ← filled manually for spotlight teams
    "key_players": [],      ← filled manually for spotlight teams
    "squad": [ ... ]        ← array of player objects from stage4
  }

teams.csv
  48-row summary table. One row per team.
  Columns: country, flag_emoji, group, confederation, spotlight,
           wc_appearances, wc_best_finish, avg_confidence,
           data_completeness_pct, players_with_sofa, players_with_tm,
           players_all_sources

players.csv
  All 1245 players. One row per player.
  Columns: country, group, full_name, position, club, age, caps,
           international_goals, in_top_league, market_value_eur,
           market_value_fmt, tm_player_id, is_loan, parent_club,
           loan_club, sofa_player_id, sofa_club, sofa_league,
           club_conflict, data_sources, confidence

website/data/teams.js
  JavaScript module wrapping team_reviews.json for direct browser use.
  export const TEAMS = [ ... ];


### 4.10 Elite League Filter (Website Display)

For non-spotlight teams the website squad section shows only players whose
club is in one of the 6 elite leagues (in_top_league = true). This is already
computed per player in stage4 — no extra filtering needed in stage5.

Spotlight teams: full squad displayed (all positions, all clubs)
Non-spotlight teams: squad section shows only in_top_league players


### 4.11 Build Phases

Phase 1   DESIGN.md and project folder structure                ← DONE
Phase 2   utils/http_client.py, logger.py, name_matcher.py      ← DONE
Phase 3   teams_config.py with all 48 teams                     ← DONE
Phase 4   stage1_collect.py — Wikipedia scraper (Argentina)     ← DONE
Phase 5   Validate Argentina output manually                    ← DONE
Phase 6   Scale Wikipedia scraper to all 48 teams               ← DONE
Phase 7   stage2_enrich.py — Transfermarkt (all 48 teams)       ← DONE
Phase 8   stage3_sofascore.py — SofaScore matching (all 48)     ← DONE
Phase 9   stage4_score.py — conflicts, confidence, in_top fix   ← DONE
Phase 10  Data verification — names, clubs, leagues validated   ← DONE
Phase 11  stage5_export.py — generate all export files          ← NEXT
Phase 12  website/data/teams.js from team_reviews.json          ← (part of 11)
Phase 13  Build website: index.html, styles.css, main.js        ← TODO
Phase 14  Deploy to GitHub Pages                                ← TODO

Pipeline stats as of Phase 10:
  Teams processed:       48 / 48
  Total players:         1,245
  With SofaScore match:  1,136 (91%)
  With TM market value:  901 (72%)
  All 3 sources:         885 (71%)
  Club conflicts:        2 (genuine — transfer timing)
  League conflicts:      0 (all resolved in stage4)
  Corrupted names:       0

---

## 5. All 48 Teams by Group

Group A: Mexico 🇲🇽, South Africa 🇿🇦, South Korea 🇰🇷, Czechia 🇨🇿
Group B: Canada 🇨🇦, Bosnia and Herzegovina 🇧🇦, Qatar 🇶🇦, Switzerland 🇨🇭
Group C: Brazil 🇧🇷, Morocco 🇲🇦, Haiti 🇭🇹, Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿
Group D: United States 🇺🇸, Paraguay 🇵🇾, Australia 🇦🇺, Türkiye 🇹🇷
Group E: Germany 🇩🇪, Curaçao 🇨🇼, Ivory Coast 🇨🇮, Ecuador 🇪🇨
Group F: Netherlands 🇳🇱, Japan 🇯🇵, Sweden 🇸🇪, Tunisia 🇹🇳
Group G: Belgium 🇧🇪, Egypt 🇪🇬, Iran 🇮🇷, New Zealand 🇳🇿
Group H: Spain 🇪🇸, Cape Verde 🇨🇻, Saudi Arabia 🇸🇦, Uruguay 🇺🇾
Group I: France 🇫🇷, Senegal 🇸🇳, Norway 🇳🇴, Iraq 🇮🇶
Group J: Argentina 🇦🇷, Algeria 🇩🇿, Austria 🇦🇹, Jordan 🇯🇴
Group K: Portugal 🇵🇹, DR Congo 🇨🇩, Uzbekistan 🇺🇿, Colombia 🇨🇴
Group L: England 🏴󠁧󠁢󠁥󠁮󠁧󠁿, Croatia 🇭🇷, Ghana 🇬🇭, Panama 🇵🇦

---

## 6. Spotlight Teams (31 teams — full deep-dive content)

Group A: Mexico, South Korea, Czechia
Group B: Canada, Bosnia and Herzegovina, Switzerland
Group C: Brazil, Morocco
Group D: United States, Australia, Türkiye
Group E: Germany, Ivory Coast, Ecuador
Group F: Netherlands, Japan, Sweden
Group G: Belgium, Egypt
Group H: Spain, Uruguay
Group I: France, Senegal, Norway
Group J: Argentina, Algeria, Austria
Group K: Portugal, Colombia
Group L: England, Croatia

Non-spotlight (17 teams — compact card only):
  South Africa, Qatar, Haiti, Scotland, Paraguay, Curaçao,
  Tunisia, Iran, New Zealand, Cape Verde, Saudi Arabia,
  Iraq, Jordan, Uzbekistan, DR Congo, Ghana, Panama

---

## 7. Website Design

### 7.1 Visual Design

Color palette:
  Deep navy      #0D1B2A   primary background
  Soft cream     #F5F0E8   primary text
  Gold           #C9A84C   accents and highlights
  Card dark      #1A2A3A   card backgrounds

Typography:
  Display font   Fraunces (Google Fonts) — headings and hero text
  Body font      DM Sans (Google Fonts) — all body copy and UI

National colors:
  Each team spotlight card picks up that nation's colors
  as a subtle border accent and header tint

### 7.2 Site Sections

Hero
  Tournament name, dates, host nations tagline
  Countdown or opening match callout

How It Works
  Visual explainer of the 48-team format for beginners
  12 groups → Round of 32 → Round of 16 → QF → SF → Final
  The "8 best third-place teams" rule explained simply

All 48 Teams Grid
  Compact cards organized by group A through L
  Each card: flag emoji, country name, confederation, 1-line descriptor
  Every card is clickable — opens a detail view for that team

Spotlight Team Detail (31 teams)
  Full expandable card per team
  Sections: Overview, Full Squad, Key Players, Knockout Road, Fun Fact
  Includes market values (where available) and in_top_league badge

Non-Spotlight Team Detail (17 teams)
  Sections: Overview, WC History, Manager & Formation
  Squad section shows only players with in_top_league = true
  If no players pass the filter, squad section is hidden

Glossary
  10 terms every beginner needs:
  Offside, VAR, Clean sheet, Hat-trick, Extra time,
  Penalties, Yellow card, Red card, Group stage, Knockout round

Footer
  Built by Keerthi
  Data sources credited
  GitHub link

### 7.3 Responsive Breakpoints

Mobile (below 640px)    single column, full-width cards
Tablet (640px–1024px)   two column grid
Desktop (above 1024px)  three to four column grid, wider hero

---

## 8. Current Status

Phases 1–10 complete. Pipeline fully validated.
Next: Phase 11 — stage5_export.py

stage5_export.py will read all 48 {slug}_stage4.json files and produce:
  scraper/output/export/team_reviews.json
  scraper/output/export/teams.csv
  scraper/output/export/players.csv
  website/data/teams.js

story, fun_fact, and key_players fields in team_reviews.json will be
populated manually for the 31 spotlight teams after Phase 11 completes.
