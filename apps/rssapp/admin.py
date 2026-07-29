from django.contrib import admin
from import_export import fields, resources
from import_export.admin import ExportActionModelAdmin, ImportExportModelAdmin

from .models import (
    Article,
    ArticleUserState,
    Bookmark,
    BookmarkUserState,
    Category,
    ExtractionTask,
    Feed,
    ReadingItem,
    SomedayItem,
    Subscription,
    Tag,
    UserProfile,
)


@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    list_display = ("name", "user", "scope", "color")
    list_filter = ("scope", "user")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Tag)
class TagAdmin(ImportExportModelAdmin):
    list_display = ("name", "user", "color")
    search_fields = ("name", "user__username")
    list_filter = ("user",)


@admin.register(Feed)
class FeedAdmin(ImportExportModelAdmin):
    list_display = ("title", "name", "url", "is_active", "last_fetched_at")
    list_filter = ("is_active",)
    search_fields = ("title", "name", "url")
    readonly_fields = ("etag", "last_modified", "last_fetched_at")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "feed", "category", "display_name", "order")
    list_filter = ("user", "category")
    search_fields = ("display_name", "user__username", "feed__title")


@admin.register(Article)
class ArticleAdmin(ExportActionModelAdmin):
    list_display = ("title", "feed", "published_at", "created_at")
    list_filter = ("feed", "published_at")
    search_fields = ("title", "url", "feed__title")
    date_hierarchy = "published_at"


@admin.register(ArticleUserState)
class ArticleUserStateAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "is_read", "is_favorited", "updated_at")
    list_filter = ("is_read", "is_favorited", "user")
    raw_id_fields = ("user", "article")


@admin.register(ReadingItem)
class ReadingItemAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "url", "is_archived", "created_at")
    list_filter = ("is_archived", "user")


@admin.register(SomedayItem)
class SomedayItemAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "url", "created_at")
    list_filter = ("user",)


@admin.register(Bookmark)
class BookmarkAdmin(ImportExportModelAdmin):
    list_display = ("title", "url", "user", "category", "bookmark_type", "created_at")
    list_filter = ("user", "category", "bookmark_type")
    search_fields = ("title", "url", "note")


@admin.register(BookmarkUserState)
class BookmarkUserStateAdmin(admin.ModelAdmin):
    list_display = ("user", "bookmark", "is_pinned", "is_favorited", "updated_at")
    list_filter = ("is_pinned", "is_favorited", "user")
    raw_id_fields = ("user", "bookmark")


@admin.register(ExtractionTask)
class ExtractionTaskAdmin(admin.ModelAdmin):
    list_display = ("article", "status", "retry_count", "created_at")
    list_filter = ("status",)
    readonly_fields = ("created_at",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "default_sort", "theme_preference", "default_display_mode", "items_per_page")
    list_filter = ("default_sort", "theme_preference", "default_display_mode")
    search_fields = ("user__username",)
