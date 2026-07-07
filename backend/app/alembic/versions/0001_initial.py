"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-02 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(150), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("hashed_password", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("is_superuser", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("oauth_provider", sa.String(50), nullable=True),
        sa.Column("oauth_uid", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- categories ---
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default=sa.text("'#6b7280'")),
        sa.Column("scope", sa.String(20), nullable=False, server_default=sa.text("'rss'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"])

    # --- tags ---
    op.create_table(
        "tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default=sa.text("'#6b7280'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_tags_user_id", "tags", ["user_id"])

    # --- feeds ---
    op.create_table(
        "feeds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("site_url", sa.String(2048), nullable=True),
        sa.Column("favicon_url", sa.String(2048), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("last_fetched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetch_error", sa.Text, nullable=True),
        sa.Column("etag", sa.String(255), nullable=True),
        sa.Column("last_modified", sa.String(255), nullable=True),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_feeds_url", "feeds", ["url"], unique=True)

    # --- subscriptions ---
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "feed_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("feeds.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("display_name", sa.String(500), nullable=True),
        sa.Column("order", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "feed_id", name="uq_subscription_user_feed"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_feed_id", "subscriptions", ["feed_id"])

    # --- articles ---
    op.create_table(
        "articles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "feed_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("feeds.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("url_hash", sa.String(64), nullable=False),
        sa.Column("title", sa.String(1000), nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("author", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("feed_id", "url_hash", name="uq_article_feed_url_hash"),
    )
    op.create_index("ix_articles_feed_id", "articles", ["feed_id"])
    op.create_index("ix_articles_url_hash", "articles", ["url_hash"])
    op.create_index("ix_articles_published_at", "articles", ["published_at"])

    # --- article_user_states ---
    op.create_table(
        "article_user_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "article_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_favorited", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "article_id", name="uq_article_user_state"),
    )
    op.create_index("ix_article_user_states_user_id", "article_user_states", ["user_id"])
    op.create_index("ix_article_user_states_article_id", "article_user_states", ["article_id"])

    # --- reading_items ---
    op.create_table(
        "reading_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "article_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("url", sa.String(2048), nullable=True),
        sa.Column("title", sa.String(1000), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("order", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "article_id", name="uq_reading_item_user_article"),
    )
    op.create_index("ix_reading_items_user_id", "reading_items", ["user_id"])
    op.create_index("ix_reading_items_article_id", "reading_items", ["article_id"])

    # --- someday_items ---
    op.create_table(
        "someday_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "article_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("url", sa.String(2048), nullable=True),
        sa.Column("title", sa.String(1000), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("order", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "article_id", name="uq_someday_item_user_article"),
    )
    op.create_index("ix_someday_items_user_id", "someday_items", ["user_id"])
    op.create_index("ix_someday_items_article_id", "someday_items", ["article_id"])

    # --- bookmarks ---
    op.create_table(
        "bookmarks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "bookmark_type", sa.String(20), nullable=False, server_default=sa.text("'content'")
        ),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("title", sa.String(1000), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"])

    # --- bookmark_tags (many-to-many) ---
    op.create_table(
        "bookmark_tags",
        sa.Column(
            "bookmark_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bookmarks.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    # --- bookmark_user_states ---
    op.create_table(
        "bookmark_user_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bookmark_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bookmarks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_pinned", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_favorited", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "bookmark_id", name="uq_bookmark_user_state"),
    )
    op.create_index("ix_bookmark_user_states_user_id", "bookmark_user_states", ["user_id"])
    op.create_index("ix_bookmark_user_states_bookmark_id", "bookmark_user_states", ["bookmark_id"])


def downgrade() -> None:
    op.drop_table("bookmark_user_states")
    op.drop_table("bookmark_tags")
    op.drop_table("bookmarks")
    op.drop_table("someday_items")
    op.drop_table("reading_items")
    op.drop_table("article_user_states")
    op.drop_table("articles")
    op.drop_table("subscriptions")
    op.drop_table("feeds")
    op.drop_table("tags")
    op.drop_table("categories")
    op.drop_table("users")
