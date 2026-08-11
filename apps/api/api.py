from ninja import NinjaAPI

from apps.api.routers.auth import router as auth_router
from apps.api.routers.bookmarks import router as bookmarks_router
from apps.api.routers.common import router as common_router
from apps.api.routers.feeds import router as feeds_router
from apps.api.routers.reading import router as reading_router
from apps.api.routers.worker import router as worker_router

api = NinjaAPI(
    title="Feedee API",
    version="2.0.0",
    description="Feedee v2 — RSS reader & bookmark manager API (Django Ninja)",
    urls_namespace="api_v2",
)


@api.get("/health", auth=None)
def health(request):
    return {"status": "ok"}


api.add_router("/auth", auth_router)
api.add_router("/worker", worker_router)
api.add_router("/bookmarks", bookmarks_router)
api.add_router("", common_router)
api.add_router("", feeds_router)
api.add_router("", reading_router)
