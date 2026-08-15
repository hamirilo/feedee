from django.urls import path

from .views import (
    bookmark_add_view,
    bookmark_category_list_view,
    bookmark_category_reorder_view,
    bookmark_category_update_view,
    bookmark_delete_view,
    bookmark_edit_view,
    bookmark_from_article_view,
    bookmark_state_toggle_view,
    bookmarklet_view,
    bookmarks_page_view,
    tag_update_view,
)

urlpatterns = [
    path("bookmarks/", bookmarks_page_view, name="bookmarks-page"),
    path("old-bookmarks/", bookmarks_page_view, name="bookmark-list"),
    path("bookmarks/add/", bookmark_add_view, name="bookmark-add"),
    path("bookmarks/bookmarklet/", bookmarklet_view, name="bookmarklet"),
    path("bookmarks/<uuid:bookmark_id>/edit/", bookmark_edit_view, name="bookmark-edit"),
    path(
        "bookmarks/<uuid:bookmark_id>/delete/",
        bookmark_delete_view,
        name="bookmark-delete",
    ),
    path(
        "bookmarks/from-article/<uuid:article_id>/",
        bookmark_from_article_view,
        name="bookmark-from-article",
    ),
    path(
        "bookmarks/<uuid:bookmark_id>/state/<str:state_field>/toggle/",
        bookmark_state_toggle_view,
        name="bookmark-state-toggle",
    ),
    path("tags/<uuid:tag_id>/update/", tag_update_view, name="tag-update"),
    path(
        "bookmarks/categories/",
        bookmark_category_list_view,
        name="bookmark-category-list",
    ),
    path(
        "bookmarks/categories/<uuid:category_id>/update/",
        bookmark_category_update_view,
        name="bookmark-category-update",
    ),
    path(
        "bookmarks/categories/reorder/",
        bookmark_category_reorder_view,
        name="bookmark-category-reorder",
    ),
]
