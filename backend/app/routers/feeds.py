import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.article import Article, ArticleUserState
from app.models.common import Category
from app.models.feed import Feed, Subscription
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/feeds", tags=["Feeds & Articles"])


class FeedSubscribeRequest(BaseModel):
    url: str
    category_id: str | None = None
    display_name: str | None = None


class FeedUpdate(BaseModel):
    display_name: str | None = None
    category_id: str | None = None


class FeedResponse(BaseModel):
    id: uuid.UUID
    url: str
    title: str | None = None
    site_url: str | None = None
    favicon_url: str | None = None
    display_name: str | None = None
    category_id: uuid.UUID | None = None
    order: int

    class Config:
        from_attributes = True


class ArticleResponse(BaseModel):
    id: uuid.UUID
    feed_id: uuid.UUID
    feed_title: str | None
    url: str
    title: str | None
    summary: str | None
    content: str | None
    thumbnail_url: str | None
    published_at: datetime | None
    is_read: bool
    is_favorited: bool

    class Config:
        from_attributes = True


@router.get("", response_model=list[FeedResponse])
async def get_user_feeds(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    query = (
        select(Subscription)
        .options(selectinload(Subscription.feed))
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.order.asc())
    )
    result = await db.execute(query)
    subs = result.scalars().all()

    return [
        FeedResponse(
            id=str(sub.feed_id),
            url=sub.feed.url,
            title=sub.feed.title,
            site_url=sub.feed.site_url,
            favicon_url=sub.feed.favicon_url,
            display_name=sub.display_name,
            category_id=str(sub.category_id) if sub.category_id else None,
            order=sub.order,
        )
        for sub in subs
    ]


@router.post("", response_model=FeedResponse, status_code=status.HTTP_201_CREATED)
async def subscribe_feed(
    payload: FeedSubscribeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check if category exists
    cat_uuid = None
    if payload.category_id:
        try:
            cat_uuid = uuid.UUID(payload.category_id)
            cat_check = await db.execute(
                select(Category).where(Category.id == cat_uuid, Category.user_id == current_user.id)
            )
            if not cat_check.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Category not found")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category UUID")

    # Find or create Feed
    feed_result = await db.execute(select(Feed).where(Feed.url == payload.url))
    feed = feed_result.scalar_one_or_none()

    if not feed:
        feed = Feed(
            url=payload.url,
            title=payload.display_name or payload.url,
            is_active=True,
        )
        db.add(feed)
        await db.flush()  # Populates feed.id

    # Check if already subscribed
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.feed_id == feed.id,
        )
    )
    existing_sub = sub_result.scalar_one_or_none()
    if existing_sub:
        raise HTTPException(status_code=400, detail="Already subscribed to this feed")

    # Create subscription
    subscription = Subscription(
        user_id=current_user.id,
        feed_id=feed.id,
        category_id=cat_uuid,
        display_name=payload.display_name or feed.title,
        order=0,
    )
    db.add(subscription)
    await db.commit()

    return FeedResponse(
        id=str(feed.id),
        url=feed.url,
        title=feed.title,
        site_url=feed.site_url,
        favicon_url=feed.favicon_url,
        display_name=subscription.display_name,
        category_id=str(subscription.category_id) if subscription.category_id else None,
        order=subscription.order,
    )


@router.delete("/{feed_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe_feed(
    feed_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        feed_uuid = uuid.UUID(feed_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feed UUID")

    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.feed_id == feed_uuid,
        )
    )
    sub = sub_result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    await db.delete(sub)
    await db.commit()


@router.put("/{feed_id}", response_model=FeedResponse)
async def update_subscription(
    feed_id: str,
    payload: FeedUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        feed_uuid = uuid.UUID(feed_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feed UUID")

    # Find subscription
    result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.feed))
        .where(
            Subscription.user_id == current_user.id,
            Subscription.feed_id == feed_uuid,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Update category
    if payload.category_id is not None:
        if payload.category_id == "":
            sub.category_id = None
        else:
            try:
                cat_uuid = uuid.UUID(payload.category_id)
                cat_check = await db.execute(
                    select(Category).where(
                        Category.id == cat_uuid, Category.user_id == current_user.id
                    )
                )
                if not cat_check.scalar_one_or_none():
                    raise HTTPException(status_code=400, detail="Category not found")
                sub.category_id = cat_uuid
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid category UUID")

    # Update display name
    if payload.display_name is not None:
        sub.display_name = payload.display_name or sub.feed.title or sub.feed.url

    await db.commit()
    await db.refresh(sub)

    return FeedResponse(
        id=str(sub.feed_id),
        url=sub.feed.url,
        title=sub.feed.title,
        site_url=sub.feed.site_url,
        favicon_url=sub.feed.favicon_url,
        display_name=sub.display_name,
        category_id=str(sub.category_id) if sub.category_id else None,
        order=sub.order,
    )


@router.get("/articles", response_model=list[ArticleResponse])
async def get_articles(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_read: bool | None = None,
    is_favorited: bool | None = None,
    feed_id: str | None = None,
    category_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    # Build query selecting Articles and joining UserStates
    query = (
        select(Article, ArticleUserState, Feed.title)
        .join(
            ArticleUserState,
            and_(
                ArticleUserState.article_id == Article.id,
                ArticleUserState.user_id == current_user.id,
            ),
        )
        .join(Feed, Feed.id == Article.feed_id)
        .join(
            Subscription,
            and_(Subscription.feed_id == Feed.id, Subscription.user_id == current_user.id),
        )
    )

    if is_read is not None:
        query = query.where(ArticleUserState.is_read == is_read)
    if is_favorited is not None:
        query = query.where(ArticleUserState.is_favorited == is_favorited)
    if feed_id:
        try:
            feed_uuid = uuid.UUID(feed_id)
            query = query.where(Article.feed_id == feed_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid feed UUID")
    if category_id:
        try:
            cat_uuid = uuid.UUID(category_id)
            query = query.where(Subscription.category_id == cat_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category UUID")

    query = (
        query.order_by(Article.published_at.desc(), Article.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        ArticleResponse(
            id=str(row.Article.id),
            feed_id=str(row.Article.feed_id),
            feed_title=row.title,
            url=row.Article.url,
            title=row.Article.title,
            summary=row.Article.summary,
            content=row.Article.content,
            thumbnail_url=row.Article.thumbnail_url,
            published_at=row.Article.published_at,
            is_read=row.ArticleUserState.is_read,
            is_favorited=row.ArticleUserState.is_favorited,
        )
        for row in rows
    ]


@router.post("/articles/{article_id}/read")
async def mark_article_read(
    article_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        art_uuid = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid article UUID")

    result = await db.execute(
        select(ArticleUserState).where(
            ArticleUserState.user_id == current_user.id,
            ArticleUserState.article_id == art_uuid,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Article state not found")

    state.is_read = True
    await db.commit()
    return {"status": "ok"}


@router.post("/articles/{article_id}/unread")
async def mark_article_unread(
    article_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        art_uuid = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid article UUID")

    result = await db.execute(
        select(ArticleUserState).where(
            ArticleUserState.user_id == current_user.id,
            ArticleUserState.article_id == art_uuid,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Article state not found")

    state.is_read = False
    await db.commit()
    return {"status": "ok"}


@router.post("/articles/{article_id}/favorite")
async def favorite_article(
    article_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        art_uuid = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid article UUID")

    result = await db.execute(
        select(ArticleUserState).where(
            ArticleUserState.user_id == current_user.id,
            ArticleUserState.article_id == art_uuid,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Article state not found")

    state.is_favorited = True
    await db.commit()
    return {"status": "ok"}


@router.post("/articles/{article_id}/unfavorite")
async def unfavorite_article(
    article_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        art_uuid = uuid.UUID(article_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid article UUID")

    result = await db.execute(
        select(ArticleUserState).where(
            ArticleUserState.user_id == current_user.id,
            ArticleUserState.article_id == art_uuid,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Article state not found")

    state.is_favorited = False
    await db.commit()
    return {"status": "ok"}
