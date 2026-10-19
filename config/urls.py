from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from apps.api.api import api
from passport_client.views import admin_login


def health_view(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    # ログインは passport に任せる。Admin のログイン画面も passport へ回す（admin より前）。
    path("admin/login/", admin_login),
    path("admin/", admin.site.urls),
    path("oidc/", include("passport_client.urls")),
    path("app/", api.urls),
    path("health", health_view),
    path(
        "rss/",
        include(("apps.rss_service.urls", "rss_service"), namespace="rss_service"),
    ),
    path(
        "bookmark-service/",
        include(
            ("apps.bookmark_service.urls", "bookmark_service"),
            namespace="bookmark_service",
        ),
    ),
    path(
        "api/rss/",
        include(
            ("apps.rss_service.api_urls", "rss_service_api"),
            namespace="rss_service_api",
        ),
    ),
    path(
        "api/bookmarks/",
        include(
            ("apps.bookmark_service.api_urls", "bookmark_service_api"),
            namespace="bookmark_service_api",
        ),
    ),
    path("", include("apps.rssapp.urls")),
    path("api/", include("apps.rssapp.api_urls")),
]
