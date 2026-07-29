import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Category(models.Model):
    class Scope(models.TextChoices):
        RSS = "rss", "RSS"
        BOOKMARK = "bookmark", "Bookmark"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    color = models.CharField(max_length=7, default="#6b7280")
    scope = models.CharField(
        max_length=20,
        choices=Scope.choices,
        default=Scope.RSS,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name


# Backward compatibility alias for legacy templates/views
BookmarkCategory = Category


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tags",
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, blank=True, default="")
    color = models.CharField(max_length=7, default="#6b7280")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tags"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Feed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(max_length=2048, unique=True)
    title = models.CharField(max_length=500, null=True, blank=True)
    name = models.CharField(max_length=500, null=True, blank=True)
    category = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(null=True, blank=True)
    site_url = models.URLField(max_length=2048, null=True, blank=True)
    favicon_url = models.URLField(max_length=2048, null=True, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    last_fetched_at = models.DateTimeField(null=True, blank=True)
    fetch_error = models.TextField(null=True, blank=True)
    etag = models.CharField(max_length=255, null=True, blank=True)
    last_modified = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "feeds"
        ordering = ["display_order", "name", "title"]

    def save(self, *args, **kwargs):
        if not self.name and self.title:
            self.name = self.title
        elif not self.title and self.name:
            self.title = self.name
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title or self.name or self.url


class Subscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    feed = models.ForeignKey(
        Feed,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscriptions",
    )
    display_name = models.CharField(max_length=500, null=True, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscriptions"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "feed"], name="uq_subscription_user_feed"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} -> {self.feed}"


class Article(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feed = models.ForeignKey(
        Feed,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="articles",
    )
    url = models.URLField(max_length=2048, default="")
    link = models.URLField(max_length=2048, default="")
    normalized_link = models.URLField(max_length=2048, default="")
    guid = models.CharField(max_length=500, null=True, blank=True)
    hash = models.CharField(max_length=64, blank=True, default="")
    url_hash = models.CharField(max_length=64, db_index=True, default="")
    title = models.CharField(max_length=1000, null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    author = models.CharField(max_length=500, null=True, blank=True)
    thumbnail_url = models.URLField(max_length=2048, null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "articles"
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.link and self.url:
            self.link = self.url
        elif not self.url and self.link:
            self.url = self.link
        if not self.normalized_link:
            self.normalized_link = self.url or self.link
        if not self.hash and self.url_hash:
            self.hash = self.url_hash
        elif not self.url_hash and self.hash:
            self.url_hash = self.hash
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title or self.url or self.link


class ArticleUserState(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="article_states",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="user_states",
    )
    is_read = models.BooleanField(default=False)
    is_favorited = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "article_user_states"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "article"], name="uq_article_user_state"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} article_state {self.article_id}"


class ReadingItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reading_items",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reading_items",
    )
    url = models.URLField(max_length=2048, null=True, blank=True)
    title = models.CharField(max_length=1000, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(max_length=2048, null=True, blank=True)
    order = models.IntegerField(default=0)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reading_items"

    def __str__(self) -> str:
        return f"{self.user} reading_item {self.title or self.url}"


class SomedayItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="someday_items",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="someday_items",
    )
    url = models.URLField(max_length=2048, null=True, blank=True)
    title = models.CharField(max_length=1000, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(max_length=2048, null=True, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "someday_items"

    def __str__(self) -> str:
        return f"{self.user} someday_item {self.title or self.url}"


class Bookmark(models.Model):
    class Type(models.TextChoices):
        RESOURCE = "resource", "Resource"
        CONTENT = "content", "Content"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookmarks",
    )
    bookmark_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.CONTENT,
    )
    url = models.URLField(max_length=2048)
    title = models.CharField(max_length=1000, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    thumbnail_url = models.URLField(max_length=2048, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="bookmarks", db_table="bookmark_tags")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookmarks"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title or self.url


class BookmarkUserState(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmark_states",
    )
    bookmark = models.OneToOneField(
        Bookmark,
        on_delete=models.CASCADE,
        related_name="user_state",
    )
    is_pinned = models.BooleanField(default=False)
    is_favorited = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookmark_user_states"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "bookmark"], name="uq_bookmark_user_state"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} bookmark_state {self.bookmark_id}"


class ExtractionTask(models.Model):
    article = models.OneToOneField(Article, on_delete=models.CASCADE, primary_key=True)
    status = models.CharField(max_length=20, default="pending")
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "extraction_tasks"


class UserProfile(models.Model):
    SORT_CHOICES = [
        ("published_desc", "Newest first"),
        ("published_asc", "Oldest first"),
    ]
    THEME_CHOICES = [
        ("system", "System"),
        ("light", "Light"),
        ("dark", "Dark"),
    ]
    DISPLAY_MODE_CHOICES = [
        ("list", "List view"),
        ("compact", "Compact view"),
        ("card", "Card view"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    default_sort = models.CharField(max_length=20, default="published_desc", choices=SORT_CHOICES)
    items_per_page = models.PositiveIntegerField(default=20)
    theme_preference = models.CharField(max_length=10, default="system", choices=THEME_CHOICES)
    default_display_mode = models.CharField(max_length=20, default="compact", choices=DISPLAY_MODE_CHOICES)

    class Meta:
        db_table = "user_profiles"
