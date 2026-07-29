import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from ninja import Router, Schema
from ninja.errors import HttpError

from apps.api.security import worker_auth
from apps.rssapp.models import Article, ArticleUserState, Feed, Subscription

router = Router(tags=["Go Worker Sync"], auth=worker_auth)


class WorkerFeedResponse(Schema):
    id: UUID
    name: str
    url: str
    etag: Optional[str] = None
    last_modified: Optional[str] = None


class FeedStatusPayload(Schema):
    status: str  # "success", "not_modified", "error"
    http_status: int
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    item_count: int = 0
    error: Optional[str] = None


class IngestArticlePayload(Schema):
    feed_id: str
    title: str
    link: str
    guid: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    published_at: Optional[str] = None


@router.get("/feeds", response=List[WorkerFeedResponse])
def get_worker_feeds(request):
    feeds = Feed.objects.filter(is_active=True)
    return [
        WorkerFeedResponse(
            id=f.id,
            name=f.title or f.url,
            url=f.url,
            etag=f.etag,
            last_modified=f.last_modified,
        )
        for f in feeds
    ]


@router.post("/feeds/{feed_id}/fetch-status")
def post_worker_feed_status(request, feed_id: UUID, payload: FeedStatusPayload):
    try:
        feed = Feed.objects.get(id=feed_id)
    except Feed.DoesNotExist:
        raise HttpError(404, "Feed not found")

    feed.last_fetched_at = datetime.now(timezone.utc)
    if payload.status == "error":
        feed.fetch_error = payload.error
    else:
        feed.fetch_error = None
        if payload.etag:
            feed.etag = payload.etag
        if payload.last_modified:
            feed.last_modified = payload.last_modified

    feed.save()
    return {"status": "ok"}


@router.post("/articles/ingest")
def ingest_articles(request, payload: List[IngestArticlePayload]):
    created_count = 0
    skipped_count = 0

    for item in payload:
        try:
            feed_uuid = UUID(item.feed_id)
        except ValueError:
            skipped_count += 1
            continue

        try:
            feed = Feed.objects.get(id=feed_uuid)
        except Feed.DoesNotExist:
            skipped_count += 1
            continue

        url_hash = hashlib.sha256(item.link.encode("utf-8")).hexdigest()

        if Article.objects.filter(feed=feed, url_hash=url_hash).exists():
            skipped_count += 1
            continue

        published_dt = None
        if item.published_at:
            try:
                published_dt = datetime.fromisoformat(
                    item.published_at.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        article = Article.objects.create(
            feed=feed,
            url=item.link,
            url_hash=url_hash,
            title=item.title,
            summary=item.summary,
            content=item.content,
            thumbnail_url=item.image_url,
            published_at=published_dt,
        )

        subscribers = Subscription.objects.filter(feed=feed).values_list(
            "user_id", flat=True
        )
        states = [
            ArticleUserState(
                user_id=user_id,
                article=article,
                is_read=False,
                is_favorited=False,
            )
            for user_id in subscribers
        ]
        if states:
            ArticleUserState.objects.bulk_create(states, ignore_conflicts=True)

        created_count += 1

    return {
        "ok": True,
        "received": len(payload),
        "created": created_count,
        "skipped": skipped_count,
    }
