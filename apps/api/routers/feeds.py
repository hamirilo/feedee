from datetime import datetime
from typing import List, Optional
from uuid import UUID
from ninja import Router, Schema
from ninja.errors import HttpError

from apps.api.security import jwt_auth
from apps.rssapp.models import Article, ArticleUserState, Category, Feed, Subscription

router = Router(tags=["Feeds & Articles"], auth=jwt_auth)


class FeedSubscribeRequest(Schema):
    url: str
    category_id: Optional[str] = None
    display_name: Optional[str] = None


class FeedUpdate(Schema):
    display_name: Optional[str] = None
    category_id: Optional[str] = None


class FeedResponse(Schema):
    id: UUID
    url: str
    title: Optional[str] = None
    site_url: Optional[str] = None
    favicon_url: Optional[str] = None
    display_name: Optional[str] = None
    category_id: Optional[UUID] = None
    order: int


class ArticleResponse(Schema):
    id: UUID
    feed_id: UUID
    feed_title: Optional[str] = None
    url: str
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    thumbnail_url: Optional[str] = None
    published_at: Optional[datetime] = None
    is_read: bool = False
    is_favorited: bool = False


@router.get("/feeds", response=List[FeedResponse])
def get_user_feeds(request):
    subs = (
        Subscription.objects.filter(user=request.auth)
        .select_related("feed", "category")
        .order_by("order")
    )
    result = []
    for sub in subs:
        result.append(
            FeedResponse(
                id=sub.feed.id,
                url=sub.feed.url,
                title=sub.feed.title,
                site_url=sub.feed.site_url,
                favicon_url=sub.feed.favicon_url,
                display_name=sub.display_name or sub.feed.title or sub.feed.url,
                category_id=sub.category.id if sub.category else None,
                order=sub.order,
            )
        )
    return result


@router.post("/feeds", response={201: FeedResponse})
def subscribe_feed(request, payload: FeedSubscribeRequest):
    category = None
    if payload.category_id:
        try:
            category = Category.objects.get(id=payload.category_id, user=request.auth)
        except (Category.DoesNotExist, ValueError):
            raise HttpError(400, "Category not found or invalid UUID")

    feed, _ = Feed.objects.get_or_create(
        url=payload.url,
        defaults={"title": payload.display_name or payload.url, "is_active": True},
    )

    if Subscription.objects.filter(user=request.auth, feed=feed).exists():
        raise HttpError(400, "Already subscribed to this feed")

    sub = Subscription.objects.create(
        user=request.auth,
        feed=feed,
        category=category,
        display_name=payload.display_name or feed.title or feed.url,
        order=0,
    )

    return 201, FeedResponse(
        id=feed.id,
        url=feed.url,
        title=feed.title,
        site_url=feed.site_url,
        favicon_url=feed.favicon_url,
        display_name=sub.display_name,
        category_id=sub.category.id if sub.category else None,
        order=sub.order,
    )


@router.delete("/feeds/{feed_id}", response={204: None})
def unsubscribe_feed(request, feed_id: UUID):
    try:
        sub = Subscription.objects.get(user=request.auth, feed_id=feed_id)
        sub.delete()
        return 204, None
    except Subscription.DoesNotExist:
        raise HttpError(404, "Subscription not found")


@router.put("/feeds/{feed_id}", response=FeedResponse)
def update_subscription(request, feed_id: UUID, payload: FeedUpdate):
    try:
        sub = Subscription.objects.select_related("feed").get(
            user=request.auth, feed_id=feed_id
        )
    except Subscription.DoesNotExist:
        raise HttpError(404, "Subscription not found")

    if payload.category_id is not None:
        if payload.category_id == "":
            sub.category = None
        else:
            try:
                sub.category = Category.objects.get(
                    id=payload.category_id, user=request.auth
                )
            except (Category.DoesNotExist, ValueError):
                raise HttpError(400, "Category not found or invalid UUID")

    if payload.display_name is not None:
        sub.display_name = payload.display_name or sub.feed.title or sub.feed.url

    sub.save()

    return FeedResponse(
        id=sub.feed.id,
        url=sub.feed.url,
        title=sub.feed.title,
        site_url=sub.feed.site_url,
        favicon_url=sub.feed.favicon_url,
        display_name=sub.display_name,
        category_id=sub.category.id if sub.category else None,
        order=sub.order,
    )


@router.get("/feeds/articles", response=List[ArticleResponse])
def get_articles(
    request,
    is_read: Optional[bool] = None,
    is_favorited: Optional[bool] = None,
    feed_id: Optional[UUID] = None,
    category_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
):
    # Filter user subscribed feeds
    sub_feed_ids = Subscription.objects.filter(user=request.auth).values_list(
        "feed_id", flat=True
    )
    if category_id:
        sub_feed_ids = Subscription.objects.filter(
            user=request.auth, category_id=category_id
        ).values_list("feed_id", flat=True)

    if feed_id:
        sub_feed_ids = [fid for fid in sub_feed_ids if fid == feed_id]

    articles = (
        Article.objects.filter(feed_id__in=sub_feed_ids)
        .select_related("feed")
        .order_by("-published_at", "-created_at")
    )

    # Fetch states for user
    states = {
        st.article_id: st
        for st in ArticleUserState.objects.filter(
            user=request.auth, article_id__in=articles.values_list("id", flat=True)
        )
    }

    results = []
    for art in articles:
        st = states.get(art.id)
        art_read = st.is_read if st else False
        art_fav = st.is_favorited if st else False

        if is_read is not None and art_read != is_read:
            continue
        if is_favorited is not None and art_fav != is_favorited:
            continue

        results.append(
            ArticleResponse(
                id=art.id,
                feed_id=art.feed.id,
                feed_title=art.feed.title,
                url=art.url,
                title=art.title,
                summary=art.summary,
                content=art.content,
                thumbnail_url=art.thumbnail_url,
                published_at=art.published_at,
                is_read=art_read,
                is_favorited=art_fav,
            )
        )

        if len(results) >= limit:
            break

    return results[offset : offset + limit] if offset > 0 else results


@router.post("/feeds/articles/{article_id}/read")
def mark_article_read(request, article_id: UUID):
    st, _ = ArticleUserState.objects.get_or_create(
        user=request.auth, article_id=article_id
    )
    st.is_read = True
    st.save(update_fields=["is_read", "updated_at"])
    return {"status": "ok"}


@router.post("/feeds/articles/{article_id}/unread")
def mark_article_unread(request, article_id: UUID):
    st, _ = ArticleUserState.objects.get_or_create(
        user=request.auth, article_id=article_id
    )
    st.is_read = False
    st.save(update_fields=["is_read", "updated_at"])
    return {"status": "ok"}


@router.post("/feeds/articles/{article_id}/favorite")
def favorite_article(request, article_id: UUID):
    st, _ = ArticleUserState.objects.get_or_create(
        user=request.auth, article_id=article_id
    )
    st.is_favorited = True
    st.save(update_fields=["is_favorited", "updated_at"])
    return {"status": "ok"}


@router.post("/feeds/articles/{article_id}/unfavorite")
def unfavorite_article(request, article_id: UUID):
    st, _ = ArticleUserState.objects.get_or_create(
        user=request.auth, article_id=article_id
    )
    st.is_favorited = False
    st.save(update_fields=["is_favorited", "updated_at"])
    return {"status": "ok"}
