from uuid import UUID

from ninja import Router, Schema

from apps.api.security import jwt_auth
from apps.rssapp.models import Category, Tag

router = Router(tags=["Categories & Tags"], auth=jwt_auth)


class CategoryCreate(Schema):
    name: str
    color: str = "#6b7280"
    scope: str = "rss"


class CategoryResponse(Schema):
    id: UUID
    name: str
    color: str
    scope: str


class TagCreate(Schema):
    name: str
    color: str = "#6b7280"


class TagResponse(Schema):
    id: UUID
    name: str
    color: str


@router.get("/categories", response=list[CategoryResponse])
def get_categories(request, scope: str | None = None):
    qs = Category.objects.filter(user=request.auth)
    if scope:
        qs = qs.filter(scope=scope)
    return list(qs)


@router.post("/categories", response={201: CategoryResponse})
def create_category(request, payload: CategoryCreate):
    category = Category.objects.create(
        user=request.auth,
        name=payload.name,
        color=payload.color,
        scope=payload.scope,
    )
    return 201, category


@router.get("/tags", response=list[TagResponse])
def get_tags(request):
    qs = Tag.objects.filter(user=request.auth)
    return list(qs)


@router.post("/tags", response={201: TagResponse})
def create_tag(request, payload: TagCreate):
    tag = Tag.objects.create(
        user=request.auth,
        name=payload.name,
        color=payload.color,
    )
    return 201, tag
