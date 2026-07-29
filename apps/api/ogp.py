import logging
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


def fetch_ogp(url: str) -> dict[str, str | None]:
    res = {
        "title": None,
        "description": None,
        "thumbnail_url": None,
    }
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
    }
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code != 200:
            return res

        soup = BeautifulSoup(response.text, "html.parser")

        og_title = soup.find("meta", attrs={"property": "og:title"}) or soup.find(
            "meta", attrs={"name": "twitter:title"}
        )
        if og_title and og_title.get("content"):
            res["title"] = og_title.get("content").strip()
        elif soup.title and soup.title.string:
            res["title"] = soup.title.string.strip()

        og_desc = (
            soup.find("meta", attrs={"property": "og:description"})
            or soup.find("meta", attrs={"name": "twitter:description"})
            or soup.find("meta", attrs={"name": "description"})
        )
        if og_desc and og_desc.get("content"):
            res["description"] = og_desc.get("content").strip()

        og_image = soup.find("meta", attrs={"property": "og:image"}) or soup.find(
            "meta", attrs={"name": "twitter:image"}
        )
        if og_image and og_image.get("content"):
            img_url = og_image.get("content").strip()
            res["thumbnail_url"] = urljoin(url, img_url)

    except Exception as e:
        logger.warning(f"Error fetching OGP for {url}: {e}")

    return res
