# FIFA World Cup 2026 — team registry
#
# Source IDs are populated during Phase 4 (Argentina) and Phase 6 (all teams).
# fbref_id : squad hash  — fbref.com/en/squads/{id}/
# tm_id    : numeric ID  — transfermarkt.com/verein/{id}/
# espn_id  : numeric ID  — espn.com/soccer/team/_/id/{id}
# sofa_id  : numeric ID  — sofascore unofficial API
# wiki_slug: Wikipedia page title with underscores (no URL encoding)

# Leagues used to filter squad display for non-spotlight teams.
# Values must match the league name string returned by Transfermarkt.
TOP_LEAGUES: frozenset[str] = frozenset({
    "Premier League",   # England
    "La Liga",          # Spain
    "Bundesliga",       # Germany
    "Serie A",          # Italy
    "Ligue 1",          # France
    "Saudi Pro League", # Saudi Arabia
})

TEAMS: list[dict] = [

    # ── GROUP A ──────────────────────────────────────────────────────────────
    {
        "country": "Mexico", "flag": "🇲🇽", "group": "A",
        "confederation": "CONCACAF", "slug": "mexico", "spotlight": True,
        "fbref_id": None, "tm_id": 6303, "tm_slug": "mexiko", "espn_id": 203, "sofa_id": None,
        "wiki_slug": "Mexico_national_football_team",
    },
    {
        "country": "South Africa", "flag": "🇿🇦", "group": "A",
        "confederation": "CAF", "slug": "south-africa", "spotlight": False,
        "fbref_id": None, "tm_id": 3806, "tm_slug": "sudafrika", "espn_id": 467, "sofa_id": None,
        "wiki_slug": "South_Africa_national_football_team",
    },
    {
        "country": "South Korea", "flag": "🇰🇷", "group": "A",
        "confederation": "AFC", "slug": "south-korea", "spotlight": True,
        "fbref_id": None, "tm_id": 3589, "tm_slug": "sudkorea", "espn_id": 451, "sofa_id": None,
        "wiki_slug": "South_Korea_national_football_team",
    },
    {
        "country": "Czechia", "flag": "🇨🇿", "group": "A",
        "confederation": "UEFA", "slug": "czechia", "spotlight": True,
        "fbref_id": None, "tm_id": 3445, "tm_slug": "tschechien", "espn_id": 450, "sofa_id": None,
        "wiki_slug": "Czech_Republic_national_football_team",
    },

    # ── GROUP B ──────────────────────────────────────────────────────────────
    {
        "country": "Canada", "flag": "🇨🇦", "group": "B",
        "confederation": "CONCACAF", "slug": "canada", "spotlight": True,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 206, "sofa_id": None,
        "wiki_slug": "Canada_men's_national_soccer_team",
    },
    {
        "country": "Bosnia and Herzegovina", "flag": "🇧🇦", "group": "B",
        "confederation": "UEFA", "slug": "bosnia-and-herzegovina", "spotlight": True,
        "fbref_id": None, "tm_id": 3446, "tm_slug": "bosnien-herzegowina", "espn_id": 452, "sofa_id": None,
        "wiki_slug": "Bosnia_and_Herzegovina_national_football_team",
    },
    {
        "country": "Qatar", "flag": "🇶🇦", "group": "B",
        "confederation": "AFC", "slug": "qatar", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 4398, "sofa_id": None,
        "wiki_slug": "Qatar_national_football_team",
    },
    {
        "country": "Switzerland", "flag": "🇨🇭", "group": "B",
        "confederation": "UEFA", "slug": "switzerland", "spotlight": True,
        "fbref_id": None, "tm_id": 3384, "tm_slug": "schweiz", "espn_id": 475, "sofa_id": None,
        "wiki_slug": "Switzerland_national_football_team",
    },

    # ── GROUP C ──────────────────────────────────────────────────────────────
    {
        "country": "Brazil", "flag": "🇧🇷", "group": "C",
        "confederation": "CONMEBOL", "slug": "brazil", "spotlight": True,
        "fbref_id": None, "tm_id": 3439, "tm_slug": "brasilien", "espn_id": 205, "sofa_id": None,
        "wiki_slug": "Brazil_national_football_team",
    },
    {
        "country": "Morocco", "flag": "🇲🇦", "group": "C",
        "confederation": "CAF", "slug": "morocco", "spotlight": True,
        "fbref_id": None, "tm_id": 3575, "tm_slug": "marokko", "espn_id": 2869, "sofa_id": None,
        "wiki_slug": "Morocco_national_football_team",
    },
    {
        "country": "Haiti", "flag": "🇭🇹", "group": "C",
        "confederation": "CONCACAF", "slug": "haiti", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 2654, "sofa_id": None,
        "wiki_slug": "Haiti_national_football_team",
    },
    {
        "country": "Scotland", "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "group": "C",
        "confederation": "UEFA", "slug": "scotland", "spotlight": False,
        "fbref_id": None, "tm_id": 3380, "tm_slug": "schottland", "espn_id": 580, "sofa_id": None,
        "wiki_slug": "Scotland_national_football_team",
    },

    # ── GROUP D ──────────────────────────────────────────────────────────────
    {
        "country": "United States", "flag": "🇺🇸", "group": "D",
        "confederation": "CONCACAF", "slug": "united-states", "spotlight": True,
        "fbref_id": None, "tm_id": 3505, "tm_slug": "vereinigte-staaten", "espn_id": 660, "sofa_id": None,
        "wiki_slug": "United_States_men's_national_soccer_team",
    },
    {
        "country": "Paraguay", "flag": "🇵🇾", "group": "D",
        "confederation": "CONMEBOL", "slug": "paraguay", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 210, "sofa_id": None,
        "wiki_slug": "Paraguay_national_football_team",
    },
    {
        "country": "Australia", "flag": "🇦🇺", "group": "D",
        "confederation": "AFC", "slug": "australia", "spotlight": True,
        "fbref_id": None, "tm_id": 3433, "tm_slug": "australien", "espn_id": 628, "sofa_id": None,
        "wiki_slug": "Australia_men%27s_national_soccer_team",
    },
    {
        "country": "Türkiye", "flag": "🇹🇷", "group": "D",
        "confederation": "UEFA", "slug": "turkiye", "spotlight": True,
        "fbref_id": None, "tm_id": 3381, "tm_slug": "turkei", "espn_id": 465, "sofa_id": None,
        "wiki_slug": "Turkey_national_football_team",
    },

    # ── GROUP E ──────────────────────────────────────────────────────────────
    {
        "country": "Germany", "flag": "🇩🇪", "group": "E",
        "confederation": "UEFA", "slug": "germany", "spotlight": True,
        "fbref_id": None, "tm_id": 3262, "tm_slug": "deutschland", "espn_id": 481, "sofa_id": None,
        "wiki_slug": "Germany_national_football_team",
    },
    {
        "country": "Curaçao", "flag": "🇨🇼", "group": "E",
        "confederation": "CONCACAF", "slug": "curacao", "spotlight": False,
        "fbref_id": None, "tm_id": 32364, "tm_slug": "curacao", "espn_id": 11678, "sofa_id": None,
        "wiki_slug": "Curaçao_national_football_team",
    },
    {
        "country": "Ivory Coast", "flag": "🇨🇮", "group": "E",
        "confederation": "CAF", "slug": "ivory-coast", "spotlight": True,
        "fbref_id": None, "tm_id": 3591, "tm_slug": "elfenbeinkuste", "espn_id": 4789, "sofa_id": None,
        "wiki_slug": "Ivory_Coast_national_football_team",
    },
    {
        "country": "Ecuador", "flag": "🇪🇨", "group": "E",
        "confederation": "CONMEBOL", "slug": "ecuador", "spotlight": True,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 209, "sofa_id": None,
        "wiki_slug": "Ecuador_national_football_team",
    },

    # ── GROUP F ──────────────────────────────────────────────────────────────
    {
        "country": "Netherlands", "flag": "🇳🇱", "group": "F",
        "confederation": "UEFA", "slug": "netherlands", "spotlight": True,
        "fbref_id": None, "tm_id": 3379, "tm_slug": "niederlande", "espn_id": 449, "sofa_id": None,
        "wiki_slug": "Netherlands_national_football_team",
    },
    {
        "country": "Japan", "flag": "🇯🇵", "group": "F",
        "confederation": "AFC", "slug": "japan", "spotlight": True,
        "fbref_id": None, "tm_id": 3435, "tm_slug": "japan", "espn_id": 627, "sofa_id": None,
        "wiki_slug": "Japan_national_football_team",
    },
    {
        "country": "Sweden", "flag": "🇸🇪", "group": "F",
        "confederation": "UEFA", "slug": "sweden", "spotlight": True,
        "fbref_id": None, "tm_id": 3557, "tm_slug": "schweden", "espn_id": 466, "sofa_id": None,
        "wiki_slug": "Sweden_men%27s_national_football_team",
    },
    {
        "country": "Tunisia", "flag": "🇹🇳", "group": "F",
        "confederation": "CAF", "slug": "tunisia", "spotlight": False,
        "fbref_id": None, "tm_id": 3670, "tm_slug": "tunesien", "espn_id": 659, "sofa_id": None,
        "wiki_slug": "Tunisia_national_football_team",
    },

    # ── GROUP G ──────────────────────────────────────────────────────────────
    {
        "country": "Belgium", "flag": "🇧🇪", "group": "G",
        "confederation": "UEFA", "slug": "belgium", "spotlight": True,
        "fbref_id": None, "tm_id": 3382, "tm_slug": "belgien", "espn_id": 459, "sofa_id": None,
        "wiki_slug": "Belgium_national_football_team",
    },
    {
        "country": "Egypt", "flag": "🇪🇬", "group": "G",
        "confederation": "CAF", "slug": "egypt", "spotlight": True,
        "fbref_id": None, "tm_id": 3672, "tm_slug": "agypten", "espn_id": 2620, "sofa_id": None,
        "wiki_slug": "Egypt_national_football_team",
    },
    {
        "country": "Iran", "flag": "🇮🇷", "group": "G",
        "confederation": "AFC", "slug": "iran", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 469, "sofa_id": None,
        "wiki_slug": "Iran_national_football_team",
    },
    {
        "country": "New Zealand", "flag": "🇳🇿", "group": "G",
        "confederation": "OFC", "slug": "new-zealand", "spotlight": False,
        "fbref_id": None, "tm_id": 9171, "tm_slug": "neuseeland", "espn_id": 2666, "sofa_id": None,
        "wiki_slug": "New_Zealand_men%27s_national_football_team",
    },

    # ── GROUP H ──────────────────────────────────────────────────────────────
    {
        "country": "Spain", "flag": "🇪🇸", "group": "H",
        "confederation": "UEFA", "slug": "spain", "spotlight": True,
        "fbref_id": None, "tm_id": 3375, "tm_slug": "spanien", "espn_id": 164, "sofa_id": None,
        "wiki_slug": "Spain_national_football_team",
    },
    {
        "country": "Cape Verde", "flag": "🇨🇻", "group": "H",
        "confederation": "CAF", "slug": "cape-verde", "spotlight": False,
        "fbref_id": None, "tm_id": 4311, "tm_slug": "kap-verde", "espn_id": 2597, "sofa_id": None,
        "wiki_slug": "Cape_Verde_national_football_team",
    },
    {
        "country": "Saudi Arabia", "flag": "🇸🇦", "group": "H",
        "confederation": "AFC", "slug": "saudi-arabia", "spotlight": False,
        "fbref_id": None, "tm_id": 3807, "tm_slug": "saudi-arabien", "espn_id": 655, "sofa_id": None,
        "wiki_slug": "Saudi_Arabia_national_football_team",
    },
    {
        "country": "Uruguay", "flag": "🇺🇾", "group": "H",
        "confederation": "CONMEBOL", "slug": "uruguay", "spotlight": True,
        "fbref_id": None, "tm_id": 3449, "tm_slug": "uruguay", "espn_id": 212, "sofa_id": None,
        "wiki_slug": "Uruguay_national_football_team",
    },

    # ── GROUP I ──────────────────────────────────────────────────────────────
    {
        "country": "France", "flag": "🇫🇷", "group": "I",
        "confederation": "UEFA", "slug": "france", "spotlight": True,
        "fbref_id": None, "tm_id": 3377, "tm_slug": "frankreich", "espn_id": 478, "sofa_id": None,
        "wiki_slug": "France_national_football_team",
    },
    {
        "country": "Senegal", "flag": "🇸🇳", "group": "I",
        "confederation": "CAF", "slug": "senegal", "spotlight": True,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 654, "sofa_id": None,
        "wiki_slug": "Senegal_national_football_team",
    },
    {
        "country": "Norway", "flag": "🇳🇴", "group": "I",
        "confederation": "UEFA", "slug": "norway", "spotlight": True,
        "fbref_id": None, "tm_id": 3440, "tm_slug": "norwegen", "espn_id": 464, "sofa_id": None,
        "wiki_slug": "Norway_national_football_team",
    },
    {
        "country": "Iraq", "flag": "🇮🇶", "group": "I",
        "confederation": "AFC", "slug": "iraq", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 4375, "sofa_id": None,
        "wiki_slug": "Iraq_national_football_team",
    },

    # ── GROUP J ──────────────────────────────────────────────────────────────
    {
        "country": "Argentina", "flag": "🇦🇷", "group": "J",
        "confederation": "CONMEBOL", "slug": "argentina", "spotlight": True,
        "fbref_id": "f9fddd6e", "tm_id": 3437, "tm_slug": "argentinien", "espn_id": 202, "sofa_id": None,
        "wiki_slug": "Argentina_national_football_team",
    },
    {
        "country": "Algeria", "flag": "🇩🇿", "group": "J",
        "confederation": "CAF", "slug": "algeria", "spotlight": True,
        "fbref_id": None, "tm_id": 3614, "tm_slug": "algerien", "espn_id": 624, "sofa_id": None,
        "wiki_slug": "Algeria_national_football_team",
    },
    {
        "country": "Austria", "flag": "🇦🇹", "group": "J",
        "confederation": "UEFA", "slug": "austria", "spotlight": True,
        "fbref_id": None, "tm_id": 3383, "tm_slug": "osterreich", "espn_id": 474, "sofa_id": None,
        "wiki_slug": "Austria_national_football_team",
    },
    {
        "country": "Jordan", "flag": "🇯🇴", "group": "J",
        "confederation": "AFC", "slug": "jordan", "spotlight": False,
        "fbref_id": None, "tm_id": 15737, "tm_slug": "jordanien", "espn_id": 2917, "sofa_id": None,
        "wiki_slug": "Jordan_national_football_team",
    },

    # ── GROUP K ──────────────────────────────────────────────────────────────
    {
        "country": "Portugal", "flag": "🇵🇹", "group": "K",
        "confederation": "UEFA", "slug": "portugal", "spotlight": True,
        "fbref_id": None, "tm_id": 3300, "tm_slug": "portugal", "espn_id": 482, "sofa_id": None,
        "wiki_slug": "Portugal_national_football_team",
    },
    {
        "country": "DR Congo", "flag": "🇨🇩", "group": "K",
        "confederation": "CAF", "slug": "dr-congo", "spotlight": False,
        "fbref_id": None, "tm_id": 3854, "tm_slug": "demokratische-republik-kongo", "espn_id": 2850, "sofa_id": None,
        "wiki_slug": "DR_Congo_national_football_team",
    },
    {
        "country": "Uzbekistan", "flag": "🇺🇿", "group": "K",
        "confederation": "AFC", "slug": "uzbekistan", "spotlight": False,
        "fbref_id": None, "tm_id": 3563, "tm_slug": "usbekistan", "espn_id": 2570, "sofa_id": None,
        "wiki_slug": "Uzbekistan_national_football_team",
    },
    {
        "country": "Colombia", "flag": "🇨🇴", "group": "K",
        "confederation": "CONMEBOL", "slug": "colombia", "spotlight": True,
        "fbref_id": None, "tm_id": 3816, "tm_slug": "kolumbien", "espn_id": 208, "sofa_id": None,
        "wiki_slug": "Colombia_national_football_team",
    },

    # ── GROUP L ──────────────────────────────────────────────────────────────
    {
        "country": "England", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "group": "L",
        "confederation": "UEFA", "slug": "england", "spotlight": True,
        "fbref_id": None, "tm_id": 3299, "tm_slug": "england", "espn_id": 448, "sofa_id": None,
        "wiki_slug": "England_national_football_team",
    },
    {
        "country": "Croatia", "flag": "🇭🇷", "group": "L",
        "confederation": "UEFA", "slug": "croatia", "spotlight": True,
        "fbref_id": None, "tm_id": 3556, "tm_slug": "kroatien", "espn_id": 477, "sofa_id": None,
        "wiki_slug": "Croatia_national_football_team",
    },
    {
        "country": "Ghana", "flag": "🇬🇭", "group": "L",
        "confederation": "CAF", "slug": "ghana", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 4469, "sofa_id": None,
        "wiki_slug": "Ghana_national_football_team",
    },
    {
        "country": "Panama", "flag": "🇵🇦", "group": "L",
        "confederation": "CONCACAF", "slug": "panama", "spotlight": False,
        "fbref_id": None, "tm_id": None, "tm_slug": None, "espn_id": 2659, "sofa_id": None,
        "wiki_slug": "Panama_national_football_team",
    },
]


def get_team(country: str) -> dict | None:
    return next((t for t in TEAMS if t["country"] == country), None)


def get_spotlight_teams() -> list[dict]:
    return [t for t in TEAMS if t["spotlight"]]


def get_group(group: str) -> list[dict]:
    return [t for t in TEAMS if t["group"] == group.upper()]
