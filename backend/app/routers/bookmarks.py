from datetime import datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.bookmark import Bookmark, BookmarkType, BookmarkUserState
from app.models.common import Category, Tag, bookmark_tag_association
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


class BookmarkCreate(BaseModel):
    url: str
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: BookmarkType = BookmarkType.CONTENT
    category_id: str | None = None
    tag_ids: list[str] = []


class BookmarkUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: BookmarkType | None = None
    category_id: str | None = None
    tag_ids: list[str] | None = None


class TagResponse(BaseModel):
    id: str
    name: str
    color: str

    class Config:
        from_attributes = True


class BookmarkResponse(BaseModel):
    id: str
    url: str
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: BookmarkType
    category_id: str | None = None
    tags: list[TagResponse] = []
    is_pinned: bool = False
    is_favorited: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=list[BookmarkResponse])
async def get_bookmarks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    bookmark_type: BookmarkType | None = None,
    category_id: str | None = None,
    tag_id: str | None = None,
    is_pinned: bool | None = None,
    is_favorited: bool | None = None,
):
    query = (
        select(Bookmark)
        .options(selectinload(Bookmark.tags), selectinload(Bookmark.user_state))
        .where(Bookmark.user_id == current_user.id)
    )

    if bookmark_type:
        query = query.where(Bookmark.bookmark_type == bookmark_type)

    if category_id:
        try:
            cat_uuid = uuid.UUID(category_id)
            query = query.where(Bookmark.category_id == cat_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category UUID")

    if tag_id:
        try:
            tag_uuid = uuid.UUID(tag_id)
            query = query.join(Bookmark.tags).where(Tag.id == tag_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tag UUID")

    if is_pinned is not None or is_favorited is not None:
        query = query.join(BookmarkUserState)
        if is_pinned is not None:
            query = query.where(BookmarkUserState.is_pinned == is_pinned)
        if is_favorited is not None:
            query = query.where(BookmarkUserState.is_favorited == is_favorited)

    query = query.order_by(Bookmark.created_at.desc())
    result = await db.execute(query)
    bookmarks_list = result.scalars().all()

    return [
        BookmarkResponse(
            id=str(b.id),
            url=b.url,
            title=b.title,
            description=b.description,
            thumbnail_url=b.thumbnail_url,
            note=b.note,
            bookmark_type=b.bookmark_type,
            category_id=str(b.category_id) if b.category_id else None,
            tags=[TagResponse.from_orm(t) for t in b.tags],
            is_pinned=b.user_state.is_pinned if b.user_state else False,
            is_favorited=b.user_state.is_favorited if b.user_state else False,
            created_at=b.created_at,
        )
        for b in bookmarks_list
    ]


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    payload: BookmarkCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
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

    # Fetch tags
    tags_list = []
    if payload.tag_ids:
        tag_uuids = []
        for t_id in payload.tag_ids:
            try:
                tag_uuids.append(uuid.UUID(t_id))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid tag UUID: {t_id}")

        tag_result = await db.execute(
            select(Tag).where(Tag.id.in_(tag_uuids), Tag.user_id == current_user.id)
        )
        tags_list = tag_result.scalars().all()

    # Auto-fetch OGP if fields are missing
    ogp_title = payload.title
    ogp_desc = payload.description
    ogp_thumb = payload.thumbnail_url

    if not ogp_title or not ogp_desc or not ogp_thumb:
        from app.utils.ogp import fetch_ogp
        ogp_data = await fetch_ogp(payload.url)
        if not ogp_title:
            if ogp_data.get("title"):
                ogp_title = ogp_data["title"]
            else:
                from urllib.parse import urlparse
                try:
                    parsed = urlparse(payload.url)
                    ogp_title = parsed.netloc or payload.url
                except Exception:
                    ogp_title = payload.url
        if not ogp_desc:
            ogp_desc = ogp_data.get("description")
        if not ogp_thumb:
            ogp_thumb = ogp_data.get("thumbnail_url")

    # Create Bookmark
    bookmark = Bookmark(
        user_id=current_user.id,
        category_id=cat_uuid,
        bookmark_type=payload.bookmark_type,
        url=payload.url,
        title=ogp_title,
        description=ogp_desc,
        thumbnail_url=ogp_thumb,
        note=payload.note,
        tags=tags_list,
    )
    db.add(bookmark)
    await db.flush()

    # Create initial UserState
    user_state = BookmarkUserState(
        user_id=current_user.id,
        bookmark_id=bookmark.id,
        is_pinned=False,
        is_favorited=False,
    )
    db.add(user_state)
    await db.commit()

    # Re-fetch with selectinload to avoid lazy-loading MissingGreenlet error on bookmark.tags
    result = await db.execute(
        select(Bookmark)
        .options(selectinload(Bookmark.tags))
        .where(Bookmark.id == bookmark.id)
    )
    bookmark = result.scalar_one()

    return BookmarkResponse(
        id=str(bookmark.id),
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description,
        thumbnail_url=bookmark.thumbnail_url,
        note=bookmark.note,
        bookmark_type=bookmark.bookmark_type,
        category_id=str(bookmark.category_id) if bookmark.category_id else None,
        tags=[TagResponse.from_orm(t) for t in bookmark.tags],
        is_pinned=user_state.is_pinned,
        is_favorited=user_state.is_favorited,
        created_at=bookmark.created_at,
    )


@router.put("/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: str,
    payload: BookmarkUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(Bookmark)
        .options(selectinload(Bookmark.tags), selectinload(Bookmark.user_state))
        .where(Bookmark.id == b_uuid, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    # Update basic fields
    if payload.title is not None:
        bookmark.title = payload.title
    if payload.description is not None:
        bookmark.description = payload.description
    if payload.thumbnail_url is not None:
        bookmark.thumbnail_url = payload.thumbnail_url
    if payload.note is not None:
        bookmark.note = payload.note
    if payload.bookmark_type is not None:
        bookmark.bookmark_type = payload.bookmark_type

    # Update category
    if payload.category_id is not None:
        if payload.category_id == "":
            bookmark.category_id = None
        else:
            try:
                cat_uuid = uuid.UUID(payload.category_id)
                cat_check = await db.execute(
                    select(Category).where(Category.id == cat_uuid, Category.user_id == current_user.id)
                )
                if not cat_check.scalar_one_or_none():
                    raise HTTPException(status_code=400, detail="Category not found")
                bookmark.category_id = cat_uuid
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid category UUID")

    # Update tags
    if payload.tag_ids is not None:
        tag_uuids = []
        for t_id in payload.tag_ids:
            try:
                tag_uuids.append(uuid.UUID(t_id))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid tag UUID: {t_id}")

        tag_result = await db.execute(
            select(Tag).where(Tag.id.in_(tag_uuids), Tag.user_id == current_user.id)
        )
        bookmark.tags = tag_result.scalars().all()

    await db.commit()
    await db.refresh(bookmark)

    return BookmarkResponse(
        id=str(bookmark.id),
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description,
        thumbnail_url=bookmark.thumbnail_url,
        note=bookmark.note,
        bookmark_type=bookmark.bookmark_type,
        category_id=str(bookmark.category_id) if bookmark.category_id else None,
        tags=[TagResponse.from_orm(t) for t in bookmark.tags],
        is_pinned=bookmark.user_state.is_pinned if bookmark.user_state else False,
        is_favorited=bookmark.user_state.is_favorited if bookmark.user_state else False,
        created_at=bookmark.created_at,
    )


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(Bookmark).where(Bookmark.id == b_uuid, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()


@router.post("/{bookmark_id}/pin")
async def pin_bookmark(
    bookmark_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(BookmarkUserState).where(
            BookmarkUserState.bookmark_id == b_uuid,
            BookmarkUserState.user_id == current_user.id,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Bookmark state not found")

    state.is_pinned = True
    await db.commit()
    return {"status": "ok"}


@router.post("/{bookmark_id}/unpin")
async def unpin_bookmark(
    bookmark_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(BookmarkUserState).where(
            BookmarkUserState.bookmark_id == b_uuid,
            BookmarkUserState.user_id == current_user.id,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Bookmark state not found")

    state.is_pinned = False
    await db.commit()
    return {"status": "ok"}


@router.post("/{bookmark_id}/favorite")
async def favorite_bookmark(
    bookmark_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(BookmarkUserState).where(
            BookmarkUserState.bookmark_id == b_uuid,
            BookmarkUserState.user_id == current_user.id,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Bookmark state not found")

    state.is_favorited = True
    await db.commit()
    return {"status": "ok"}


@router.post("/{bookmark_id}/unfavorite")
async def unfavorite_bookmark(
    bookmark_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        b_uuid = uuid.UUID(bookmark_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bookmark UUID")

    result = await db.execute(
        select(BookmarkUserState).where(
            BookmarkUserState.bookmark_id == b_uuid,
            BookmarkUserState.user_id == current_user.id,
        )
    )
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="Bookmark state not found")

    state.is_favorited = False
    await db.commit()
    return {"status": "ok"}

