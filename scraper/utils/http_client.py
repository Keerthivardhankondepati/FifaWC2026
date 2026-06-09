import time
import requests
from urllib.parse import urlparse
from .logger import get_logger
from .robots import is_allowed

_logger = get_logger("kickoff26.http")

USER_AGENT = "kickoff26-research-bot/1.0 (student project; github.com/kickoff26)"

_DOMAIN_DELAY: dict[str, float] = {
    "fbref.com":          4.0,
    "transfermarkt.com":  3.0,
    "espn.com":           2.0,
    "en.wikipedia.org":   1.0,
    "sofascore.com":      2.0,
    "api.sofascore.com":  2.0,
}
_DEFAULT_DELAY = 2.0
_MAX_RETRIES = 3
_BACKOFF = [2, 4, 8]

_last_request: dict[str, float] = {}
_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


def _domain(url: str) -> str:
    return urlparse(url).netloc


def _wait(url: str) -> None:
    domain = _domain(url)
    delay = _DOMAIN_DELAY.get(domain, _DEFAULT_DELAY)
    elapsed = time.monotonic() - _last_request.get(domain, 0)
    if elapsed < delay:
        time.sleep(delay - elapsed)


def get(url: str, **kwargs) -> requests.Response | None:
    if not is_allowed(url):
        return None

    for attempt in range(_MAX_RETRIES):
        _wait(url)
        try:
            _last_request[_domain(url)] = time.monotonic()
            response = _session.get(url, timeout=15, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            if attempt < _MAX_RETRIES - 1:
                sleep_for = _BACKOFF[attempt]
                _logger.warning("Request failed (%s) — retry %d/%d in %ds", exc, attempt + 1, _MAX_RETRIES, sleep_for)
                time.sleep(sleep_for)
            else:
                _logger.error("All %d retries exhausted for %s: %s", _MAX_RETRIES, url, exc)
                return None
