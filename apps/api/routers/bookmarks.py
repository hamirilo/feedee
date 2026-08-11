from datetime import datetime
from urllib.parse import urlparse
from uuid import UUID

from ninja import Router, Schema
from ninja.errors import HttpError

from apps.api.ogp import fetch_ogp
from apps.api.security import jwt_auth
from apps.rssapp.models import Bookmark, BookmarkUserState, Category, Tag

router = Router(tags=["Bookmarks"], auth=jwt_auth)


class TagResponse(Schema):
    id: UUID
    name: str
    color: str


class BookmarkCreate(Schema):
    url: str
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: str = "content"
    category_id: str | None = None
    tag_ids: list[str] = []


class BookmarkUpdate(Schema):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: str | None = None
    category_id: str | None = None
    tag_ids: list[str] | None = None


class BookmarkResponse(Schema):
    id: UUID
    url: str
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    note: str | None = None
    bookmark_type: str
    category_id: UUID | None = None
    tags: list[TagResponse] = []
    is_pinned: bool = False
    is_favorited: bool = False
    created_at: datetime


def _build_bookmark_response(bookmark: Bookmark) -> BookmarkResponse:
    state = getattr(bookmark, "user_state", None)
    tag_list = [TagResponse(id=t.id, name=t.name, color=t.color) for t in bookmark.tags.all()]
    return BookmarkResponse(
        id=bookmark.id,
        url=bookmark.url,
        title=bookmark.title,
        description=bookmark.description,
        thumbnail_url=bookmark.thumbnail_url,
        note=bookmark.note,
        bookmark_type=bookmark.bookmark_type,
        category_id=bookmark.category.id if bookmark.category else None,
        tags=tag_list,
        is_pinned=state.is_pinned if state else False,
        is_favorited=state.is_favorited if state else False,
        created_at=bookmark.created_at,
    )


@router.get("", response=list[BookmarkResponse])
def get_bookmarks(
    request,
    bookmark_type: str | None = None,
    category_id: UUID | None = None,
    tag_id: UUID | None = None,
    is_pinned: bool | None = None,
    is_favorited: bool | None = None,
):
    qs = Bookmark.objects.filter(user=request.auth).select_related("category", "user_state").prefetch_related("tags")

    if bookmark_type:
        qs = qs.filter(bookmark_type=bookmark_type)
    if category_id:
        qs = qs.filter(category_id=category_id)
    if tag_id:
        qs = qs.filter(tags__id=tag_id)
    if is_pinned is not None:
        qs = qs.filter(user_state__is_pinned=is_pinned)
    if is_favorited is not None:
        qs = qs.filter(user_state__is_favorited=is_favorited)

    qs = qs.order_by("-created_at")
    return [_build_bookmark_response(b) for b in qs]


@router.post("", response={201: BookmarkResponse})
def create_bookmark(request, payload: BookmarkCreate):
    category = None
    if payload.category_id:
        try:
            category = Category.objects.get(id=payload.category_id, user=request.auth)
        except (Category.DoesNotExist, ValueError):
            raise HttpError(400, "Category not found")

    tags = []
    if payload.tag_ids:
        tags = list(Tag.objects.filter(id__in=payload.tag_ids, user=request.auth))

    title = payload.title
    description = payload.description
    thumbnail_url = payload.thumbnail_url

    if not title or not description or not thumbnail_url:
        ogp = fetch_ogp(payload.url)
        if not title:
            title = ogp.get("title") or urlparse(payload.url).netloc or payload.url
        if not description:
            description = ogp.get("description")
        if not thumbnail_url:
            thumbnail_url = ogp.get("thumbnail_url")

    bookmark = Bookmark.objects.create(
        user=request.auth,
        category=category,
        bookmark_type=payload.bookmark_type,
        url=payload.url,
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        note=payload.note,
    )
    if tags:
        bookmark.tags.set(tags)

    BookmarkUserState.objects.create(
        user=request.auth,
        bookmark=bookmark,
        is_pinned=False,
        is_favorited=False,
    )

    bookmark.refresh_from_db()
    return 201, _build_bookmark_response(bookmark)


@router.put("/{bookmark_id}", response=BookmarkResponse)
def update_bookmark(request, bookmark_id: UUID, payload: BookmarkUpdate):
    try:
        bookmark = (
            Bookmark.objects.select_related("category", "user_state")
            .prefetch_related("tags")
            .get(id=bookmark_id, user=request.auth)
        )
    except Bookmark.DoesNotExist:
        raise HttpError(404, "Bookmark not found")

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

    if payload.category_id is not None:
        if payload.category_id == "":
            bookmark.category = None
        else:
            try:
                bookmark.category = Category.objects.get(id=payload.category_id, user=request.auth)
            except (Category.DoesNotExist, ValueError):
                raise HttpError(400, "Category not found")

    if payload.tag_ids is not None:
        tags = list(Tag.objects.filter(id__in=payload.tag_ids, user=request.auth))
        bookmark.tags.set(tags)

    bookmark.save()
    return _build_bookmark_response(bookmark)


@router.delete("/{bookmark_id}", response={204: None})
def delete_bookmark(request, bookmark_id: UUID):
    try:
        bookmark = Bookmark.objects.get(id=bookmark_id, user=request.auth)
        bookmark.delete()
        return 204, None
    except Bookmark.DoesNotExist:
        raise HttpError(404, "Bookmark not found")


@router.post("/{bookmark_id}/pin")
def pin_bookmark(request, bookmark_id: UUID):
    state, _ = BookmarkUserState.objects.get_or_create(user=request.auth, bookmark_id=bookmark_id)
    state.is_pinned = True
    state.save(update_fields=["is_pinned", "updated_at"])
    return {"status": "ok"}


@router.post("/{bookmark_id}/unpin")
def unpin_bookmark(request, bookmark_id: UUID):
    state, _ = BookmarkUserState.objects.get_or_create(user=request.auth, bookmark_id=bookmark_id)
    state.is_pinned = False
    state.save(update_fields=["is_pinned", "updated_at"])
    return {"status": "ok"}


@router.post("/{bookmark_id}/favorite")
def favorite_bookmark(request, bookmark_id: UUID):
    state, _ = BookmarkUserState.objects.get_or_create(user=request.auth, bookmark_id=bookmark_id)
    state.is_favorited = True
    state.save(update_fields=["is_favorited", "updated_at"])
    return {"status": "ok"}


@router.post("/{bookmark_id}/unfavorite")
def unfavorite_bookmark(request, bookmark_id: UUID):
    state, _ = BookmarkUserState.objects.get_or_create(user=request.auth, bookmark_id=bookmark_id)
    state.is_favorited = False
    state.save(update_fields=["is_favorited", "updated_at"])
    return {"status": "ok"}
