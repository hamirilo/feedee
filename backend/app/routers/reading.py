import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.article import Article
from app.models.reading import ReadingItem, SomedayItem
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(tags=["Read Later Workflow"])


class ReadingItemCreate(BaseModel):
    url: str | None = None
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    article_id: str | None = None


class ReadingItemResponse(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID | None = None
    url: str | None = None
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    order: int
    is_archived: bool
    archived_at: datetime | None = None

    class Config:
        from_attributes = True


class SomedayItemResponse(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID | None = None
    url: str | None = None
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    order: int

    class Config:
        from_attributes = True


@router.get("/inbox", response_model=list[ReadingItemResponse])
async def get_inbox_items(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    query = (
        select(ReadingItem)
        .where(ReadingItem.user_id == current_user.id, ReadingItem.is_archived.is_(False))
        .order_by(ReadingItem.order.asc(), ReadingItem.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/inbox", response_model=ReadingItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_inbox(
    payload: ReadingItemCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    art_uuid = None
    url = payload.url
    title = payload.title
    desc = payload.description
    thumb = payload.thumbnail_url

    if payload.article_id:
        try:
            art_uuid = uuid.UUID(payload.article_id)
            article_check = await db.execute(select(Article).where(Article.id == art_uuid))
            article = article_check.scalar_one_or_none()
            if not article:
                raise HTTPException(status_code=404, detail="Article not found")
            # If RSS-based, prioritize RSS article metadata
            url = article.url
            title = article.title
            desc = article.summary
            thumb = article.thumbnail_url
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid article UUID")

    # Prevent duplicate URL/Article in ReadingItem
    dup_query = select(ReadingItem).where(ReadingItem.user_id == current_user.id)
    if art_uuid:
        dup_query = dup_query.where(ReadingItem.article_id == art_uuid)
    else:
        dup_query = dup_query.where(ReadingItem.url == url)

    dup_result = await db.execute(dup_query)
    existing_item = dup_result.scalar_one_or_none()
    if existing_item:
        if existing_item.is_archived:
            existing_item.is_archived = False
            existing_item.archived_at = None
            await db.commit()
            await db.refresh(existing_item)
        return existing_item

    item = ReadingItem(
        user_id=current_user.id,
        article_id=art_uuid,
        url=url,
        title=title,
        description=desc,
        thumbnail_url=thumb,
        order=0,
    )
    db.add(item)
    await db.commit()
    return item


@router.delete("/inbox/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inbox_item(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(ReadingItem).where(
            ReadingItem.id == item_uuid, ReadingItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()


@router.post("/inbox/{item_id}/snooze", response_model=SomedayItemResponse)
async def snooze_to_someday(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(ReadingItem).where(
            ReadingItem.id == item_uuid, ReadingItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Create SomedayItem from Inbox metadata
    someday_item = SomedayItem(
        user_id=current_user.id,
        article_id=item.article_id,
        url=item.url,
        title=item.title,
        description=item.description,
        thumbnail_url=item.thumbnail_url,
        order=0,
    )

    db.add(someday_item)
    await db.delete(item)
    await db.commit()
    return someday_item


@router.get("/someday", response_model=list[SomedayItemResponse])
async def get_someday_items(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    query = (
        select(SomedayItem)
        .where(SomedayItem.user_id == current_user.id)
        .order_by(SomedayItem.order.asc(), SomedayItem.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/someday/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_someday_item(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(SomedayItem).where(
            SomedayItem.id == item_uuid, SomedayItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()


@router.post("/someday/{item_id}/unsnooze", response_model=ReadingItemResponse)
async def unsnooze_to_inbox(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(SomedayItem).where(
            SomedayItem.id == item_uuid, SomedayItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Create ReadingItem from Someday metadata
    inbox_item = ReadingItem(
        user_id=current_user.id,
        article_id=item.article_id,
        url=item.url,
        title=item.title,
        description=item.description,
        thumbnail_url=item.thumbnail_url,
        order=0,
    )

    db.add(inbox_item)
    await db.delete(item)
    await db.commit()
    return inbox_item


@router.get("/inbox/archived", response_model=list[ReadingItemResponse])
async def get_archived_items(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = None,
):
    query = select(ReadingItem).where(
        ReadingItem.user_id == current_user.id, ReadingItem.is_archived.is_(True)
    )
    if q:
        query = query.where(
            or_(
                ReadingItem.title.ilike(f"%{q}%"),
                ReadingItem.url.ilike(f"%{q}%"),
            )
        )
    query = query.order_by(ReadingItem.archived_at.desc(), ReadingItem.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/inbox/{item_id}/archive", response_model=ReadingItemResponse)
async def archive_inbox_item(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(ReadingItem).where(
            ReadingItem.id == item_uuid, ReadingItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_archived = True
    item.archived_at = datetime.now()
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/inbox/{item_id}/unarchive", response_model=ReadingItemResponse)
async def unarchive_inbox_item(
    item_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        item_uuid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item UUID")

    result = await db.execute(
        select(ReadingItem).where(
            ReadingItem.id == item_uuid, ReadingItem.user_id == current_user.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_archived = False
    item.archived_at = None
    await db.commit()
    await db.refresh(item)
    return item

