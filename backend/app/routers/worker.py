import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.article import Article, ArticleUserState
from app.models.feed import Feed, Subscription
from app.settings import settings

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/worker", tags=["Go Worker Sync"])


# Dependency for simple shared worker token auth
async def verify_worker_token(authorization: Annotated[str | None, Header()] = None):
    if not settings.worker_api_token:
        # If no token is configured, bypass auth (development only)
        return
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )
    try:
        token_type, token = authorization.split(" ")
        if token_type.lower() != "bearer" or token != settings.worker_api_token:
            raise ValueError()
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid worker token",
        )


class WorkerFeedResponse(BaseModel):
    id: str
    name: str
    url: str
    etag: str | None = None
    last_modified: str | None = None


class FeedStatusPayload(BaseModel):
    status: str  # "success", "not_modified", "error"
    http_status: int
    etag: str | None = None
    last_modified: str | None = None
    item_count: int = 0
    error: str | None = None


class IngestArticlePayload(BaseModel):
    feed_id: str
    title: str
    link: str
    guid: str | None = None
    summary: str | None = None
    content: str | None = None
    image_url: str | None = None
    published_at: str | None = None  # ISO format string


@router.get("/feeds", response_model=list[WorkerFeedResponse], dependencies=[Depends(verify_worker_token)])
async def get_worker_feeds(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(Feed).where(Feed.is_active == True))
    feeds = result.scalars().all()
    return [
        WorkerFeedResponse(
            id=str(f.id),
            name=f.title or f.url,
            url=f.url,
            etag=f.etag,
            last_modified=f.last_modified,
        )
        for f in feeds
    ]


@router.post("/feeds/{feed_id}/fetch-status", dependencies=[Depends(verify_worker_token)])
async def post_worker_feed_status(
    feed_id: str,
    payload: FeedStatusPayload,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        feed_uuid = uuid.UUID(feed_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feed UUID format")

    result = await db.execute(select(Feed).where(Feed.id == feed_uuid))
    feed = result.scalar_one_or_none()
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")

    feed.last_fetched_at = datetime.now(timezone.utc)
    if payload.status == "error":
        feed.fetch_error = payload.error
    else:
        feed.fetch_error = None
        if payload.etag:
            feed.etag = payload.etag
        if payload.last_modified:
            feed.last_modified = payload.last_modified

    await db.commit()
    return {"status": "ok"}


@router.post("/articles/ingest", dependencies=[Depends(verify_worker_token)])
async def ingest_articles(
    articles_payload: list[IngestArticlePayload],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    created_count = 0
    skipped_count = 0

    for item in articles_payload:
        try:
            feed_uuid = uuid.UUID(item.feed_id)
        except ValueError:
            skipped_count += 1
            continue

        # Check if feed exists
        feed_result = await db.execute(select(Feed).where(Feed.id == feed_uuid))
        feed = feed_result.scalar_one_or_none()
        if not feed:
            skipped_count += 1
            continue

        # Generate url_hash
        url_hash = hashlib.sha256(item.link.encode("utf-8")).hexdigest()

        # Check if article already exists
        article_result = await db.execute(
            select(Article).where(Article.feed_id == feed_uuid, Article.url_hash == url_hash)
        )
        existing_article = article_result.scalar_one_or_none()

        if existing_article:
            skipped_count += 1
            continue

        # Parse published_at
        published_dt = None
        if item.published_at:
            try:
                published_dt = datetime.fromisoformat(item.published_at.replace("Z", "+00:00"))
            except ValueError:
                pass

        # Create new article
        new_article = Article(
            feed_id=feed_uuid,
            url=item.link,
            url_hash=url_hash,
            title=item.title,
            summary=item.summary,
            content=item.content,
            author=None,
            thumbnail_url=item.image_url,
            published_at=published_dt,
        )
        db.add(new_article)
        await db.flush()  # Populates new_article.id

        # Find all subscribers to this feed to create unread article states
        sub_result = await db.execute(select(Subscription.user_id).where(Subscription.feed_id == feed_uuid))
        subscriber_ids = sub_result.scalars().all()

        for user_id in subscriber_ids:
            state = ArticleUserState(
                user_id=user_id,
                article_id=new_article.id,
                is_read=False,
                is_favorited=False,
            )
            db.add(state)

        created_count += 1

    await db.commit()
    return {
        "ok": True,
        "received": len(articles_payload),
        "created": created_count,
        "skipped": skipped_count,
    }

