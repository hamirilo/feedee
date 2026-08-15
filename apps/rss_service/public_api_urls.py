from django.urls import path

from .views import (
    ArticleIngestView,
    ArticleUserStateView,
    DisplayModePreferenceView,
    FeedDiscoverView,
    FeedFetchStatusView,
    FeedListView,
    FeedReorderView,
)

urlpatterns = [
    path("feeds/", FeedListView.as_view(), name="feed-list"),
    path("feeds/discover/", FeedDiscoverView.as_view(), name="feed-discover"),
    path(
        "feeds/<uuid:feed_id>/fetch-status/",
        FeedFetchStatusView.as_view(),
        name="feed-fetch-status",
    ),
    path("feeds/reorder/", FeedReorderView.as_view(), name="feed-reorder"),
    path("articles/ingest/", ArticleIngestView.as_view(), name="article-ingest"),
    path(
        "articles/<uuid:article_id>/state/",
        ArticleUserStateView.as_view(),
        name="article-user-state",
    ),
    path(
        "preferences/display-mode/",
        DisplayModePreferenceView.as_view(),
        name="display-mode-preference",
    ),
]
