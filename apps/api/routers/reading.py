from datetime import datetime
from typing import List, Optional
from uuid import UUID
from django.db.models import Q
from ninja import Router, Schema
from ninja.errors import HttpError

from apps.api.security import jwt_auth
from apps.rssapp.models import Article, ReadingItem, SomedayItem

router = Router(tags=["Read Later Workflow"], auth=jwt_auth)


class ReadingItemCreate(Schema):
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    article_id: Optional[UUID] = None


class ReadingItemResponse(Schema):
    id: UUID
    article_id: Optional[UUID] = None
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order: int
    is_archived: bool
    archived_at: Optional[datetime] = None


class SomedayItemResponse(Schema):
    id: UUID
    article_id: Optional[UUID] = None
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order: int


@router.get("/inbox", response=List[ReadingItemResponse])
def get_inbox_items(request):
    items = ReadingItem.objects.filter(
        user=request.auth, is_archived=False
    ).order_by("order", "-created_at")
    return list(items)


@router.post("/inbox", response={201: ReadingItemResponse})
def add_to_inbox(request, payload: ReadingItemCreate):
    article = None
    url = payload.url
    title = payload.title
    description = payload.description
    thumbnail_url = payload.thumbnail_url

    if payload.article_id:
        try:
            article = Article.objects.get(id=payload.article_id)
            url = article.url
            title = article.title
            description = article.summary
            thumbnail_url = article.thumbnail_url
        except Article.DoesNotExist:
            raise HttpError(404, "Article not found")

    existing = None
    if article:
        existing = ReadingItem.objects.filter(
            user=request.auth, article=article
        ).first()
    elif url:
        existing = ReadingItem.objects.filter(user=request.auth, url=url).first()

    if existing:
        if existing.is_archived:
            existing.is_archived = False
            existing.archived_at = None
            existing.save(update_fields=["is_archived", "archived_at", "updated_at"])
        return 201, existing

    item = ReadingItem.objects.create(
        user=request.auth,
        article=article,
        url=url,
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        order=0,
    )
    return 201, item


@router.delete("/inbox/{item_id}", response={204: None})
def delete_inbox_item(request, item_id: UUID):
    try:
        item = ReadingItem.objects.get(id=item_id, user=request.auth)
        item.delete()
        return 204, None
    except ReadingItem.DoesNotExist:
        raise HttpError(404, "Item not found")


@router.post("/inbox/{item_id}/snooze", response=SomedayItemResponse)
def snooze_to_someday(request, item_id: UUID):
    try:
        item = ReadingItem.objects.get(id=item_id, user=request.auth)
    except ReadingItem.DoesNotExist:
        raise HttpError(404, "Item not found")

    someday = SomedayItem.objects.create(
        user=request.auth,
        article=item.article,
        url=item.url,
        title=item.title,
        description=item.description,
        thumbnail_url=item.thumbnail_url,
        order=0,
    )
    item.delete()
    return someday


@router.get("/someday", response=List[SomedayItemResponse])
def get_someday_items(request):
    items = SomedayItem.objects.filter(user=request.auth).order_by(
        "order", "-created_at"
    )
    return list(items)


@router.delete("/someday/{item_id}", response={204: None})
def delete_someday_item(request, item_id: UUID):
    try:
        item = SomedayItem.objects.get(id=item_id, user=request.auth)
        item.delete()
        return 204, None
    except SomedayItem.DoesNotExist:
        raise HttpError(404, "Item not found")


@router.post("/someday/{item_id}/unsnooze", response=ReadingItemResponse)
def unsnooze_to_inbox(request, item_id: UUID):
    try:
        item = SomedayItem.objects.get(id=item_id, user=request.auth)
    except SomedayItem.DoesNotExist:
        raise HttpError(404, "Item not found")

    inbox_item = ReadingItem.objects.create(
        user=request.auth,
        article=item.article,
        url=item.url,
        title=item.title,
        description=item.description,
        thumbnail_url=item.thumbnail_url,
        order=0,
    )
    item.delete()
    return inbox_item


@router.get("/inbox/archived", response=List[ReadingItemResponse])
def get_archived_items(request, q: Optional[str] = None):
    qs = ReadingItem.objects.filter(user=request.auth, is_archived=True)
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(url__icontains=q))
    qs = qs.order_by("-archived_at", "-created_at")
    return list(qs)


@router.post("/inbox/{item_id}/archive", response=ReadingItemResponse)
def archive_inbox_item(request, item_id: UUID):
    try:
        item = ReadingItem.objects.get(id=item_id, user=request.auth)
    except ReadingItem.DoesNotExist:
        raise HttpError(404, "Item not found")

    item.is_archived = True
    item.archived_at = datetime.now()
    item.save(update_fields=["is_archived", "archived_at", "updated_at"])
    return item


@router.post("/inbox/{item_id}/unarchive", response=ReadingItemResponse)
def unarchive_inbox_item(request, item_id: UUID):
    try:
        item = ReadingItem.objects.get(id=item_id, user=request.auth)
    except ReadingItem.DoesNotExist:
        raise HttpError(404, "Item not found")

    item.is_archived = False
    item.archived_at = None
    item.save(update_fields=["is_archived", "archived_at", "updated_at"])
    return item
