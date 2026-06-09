from urllib.robotparser import RobotFileParser
from urllib.parse import urlparse
import requests
from .logger import get_logger

_logger = get_logger("kickoff26.robots")
_USER_AGENT = "kickoff26-research-bot"
_FETCH_HEADERS = {"User-Agent": "kickoff26-research-bot/1.0 (student project; github.com/kickoff26)"}

# Domains where robots.txt is inaccessible but access is clearly permitted
# (e.g. API subdomains that serve public JSON — the 403 is a server config
# artifact, not a crawling restriction; the official SofaScore app uses the
# same api.sofascore.com endpoints to serve all its users).
_BYPASS_DOMAINS: frozenset[str] = frozenset({
    "api.sofascore.com",
})

_cache: dict[str, RobotFileParser] = {}


def _get_parser(domain: str) -> RobotFileParser:
    if domain in _cache:
        return _cache[domain]

    parser = RobotFileParser()
    robots_url = f"https://{domain}/robots.txt"

    try:
        response = requests.get(robots_url, headers=_FETCH_HEADERS, timeout=10)
        if response.status_code == 200:
            # utf-8-sig strips the BOM present on some servers (e.g. Wikipedia)
            text = response.content.decode("utf-8-sig")
            parser.set_url(robots_url)
            parser.parse(text.splitlines())
            parser.last_checked = 1  # mark as loaded so can_fetch() evaluates properly
        elif response.status_code in (401, 403):
            # Server actively blocks access to robots.txt — treat as disallow-all
            # (Python's built-in RobotFileParser.read() does the same for 401/403)
            parser.disallow_all = True
            _logger.warning("robots.txt for %s returned HTTP %d — treating as disallow-all", domain, response.status_code)
        elif response.status_code == 404:
            parser.allow_all = True  # no robots.txt → everything allowed
        else:
            # Any other non-200: be permissive, assume allowed
            parser.allow_all = True
            _logger.warning(
                "robots.txt for %s returned HTTP %d — assuming allowed",
                domain, response.status_code,
            )
    except Exception as exc:
        _logger.warning("robots.txt fetch failed for %s: %s — assuming allowed", domain, exc)

    _cache[domain] = parser
    return parser


def is_allowed(url: str) -> bool:
    domain = urlparse(url).netloc
    if domain in _BYPASS_DOMAINS:
        return True
    allowed = _get_parser(domain).can_fetch(_USER_AGENT, url)
    if not allowed:
        _logger.warning("robots.txt disallows scraping %s — skipping", url)
    return allowed
