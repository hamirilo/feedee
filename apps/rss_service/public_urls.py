from django.urls import path

from .views import (
    article_state_toggle_view,
    feed_articles_view,
    feeds_page_view,
    mark_all_read_view,
    reader_view,
    save_article_as_bookmark_view,
)

urlpatterns = [
    path("today/", feeds_page_view, name="rss-dashboard"),
    path("feeds/", feeds_page_view, name="feeds-page"),
    path("feeds/<uuid:feed_id>/", feed_articles_view, name="feed-articles"),
    path("articles/<uuid:article_id>/reader/", reader_view, name="article-reader"),
    path(
        "articles/<uuid:article_id>/state/<str:state_field>/toggle/",
        article_state_toggle_view,
        name="article-state-toggle",
    ),
    path(
        "articles/<uuid:article_id>/save/",
        save_article_as_bookmark_view,
        name="article-save",
    ),
    path("mark-all-read/", mark_all_read_view, name="mark-all-read"),
]
