from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.common import Category, CategoryScope, Tag
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(tags=["Categories & Tags"])


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = Field("#6b7280", max_length=7)
    scope: CategoryScope = CategoryScope.RSS


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    scope: CategoryScope

    class Config:
        from_attributes = True


class TagCreate(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = Field("#6b7280", max_length=7)


class TagResponse(BaseModel):
    id: str
    name: str
    color: str

    class Config:
        from_attributes = True


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    scope: CategoryScope | None = None,
):
    query = select(Category).where(Category.user_id == current_user.id)
    if scope:
        query = query.where(Category.scope == scope)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    category = Category(
        user_id=current_user.id,
        name=payload.name,
        color=payload.color,
        scope=payload.scope,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("/tags", response_model=list[TagResponse])
async def get_tags(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Tag).where(Tag.user_id == current_user.id))
    return result.scalars().all()


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    tag = Tag(
        user_id=current_user.id,
        name=payload.name,
        color=payload.color,
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

