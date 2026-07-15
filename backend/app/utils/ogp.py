import logging
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("uvicorn.error")

async def fetch_ogp(url: str) -> dict[str, str | None]:
    """
    指定された URL から HTML を取得し、OGP 情報をパースして返します。
    エラーが発生した場合や、一部情報が取得できない場合も例外をスローせず、
    取得できた部分のみを辞書形式で返します。
    """
    res = {
        "title": None,
        "description": None,
        "thumbnail_url": None,
    }
    
    # ユーザーエージェントをブラウザ風にして、一部のサイトによるアクセス拒否を防ぐ
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch OGP from {url}: status {response.status_code}")
                return res
            
            # HTML パース
            # レスポンスエンコーディングの調整（文字化け防止）
            html_content = response.text
            soup = BeautifulSoup(html_content, "html.parser")
            
            # 1. タイトルの取得
            # og:title -> twitter:title -> <title>
            og_title = soup.find("meta", attrs={"property": "og:title"}) or soup.find("meta", attrs={"name": "twitter:title"})
            if og_title and og_title.get("content"):
                res["title"] = og_title.get("content").strip()
            elif soup.title and soup.title.string:
                res["title"] = soup.title.string.strip()
            
            # 2. 説明文の取得
            # og:description -> twitter:description -> meta description
            og_desc = (
                soup.find("meta", attrs={"property": "og:description"})
                or soup.find("meta", attrs={"name": "twitter:description"})
                or soup.find("meta", attrs={"name": "description"})
            )
            if og_desc and og_desc.get("content"):
                res["description"] = og_desc.get("content").strip()
            
            # 3. サムネイル画像URLの取得
            # og:image -> twitter:image
            og_image = soup.find("meta", attrs={"property": "og:image"}) or soup.find("meta", attrs={"name": "twitter:image"})
            if og_image and og_image.get("content"):
                img_url = og_image.get("content").strip()
                # 相対パスの場合は絶対パスに変換
                res["thumbnail_url"] = urljoin(url, img_url)
                
    except Exception as e:
        logger.error(f"Error fetching OGP for {url}: {e}", exc_info=True)
        
    return res
