import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Article(Base, TimestampMixin):
    """RSSフィードから取得した記事。フィード単位で管理。"""

    __tablename__ = "articles"
    __table_args__ = (UniqueConstraint("feed_id", "url_hash", name="uq_article_feed_url_hash"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feeds.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    url_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # relationships
    feed: Mapped["Feed"] = relationship(back_populates="articles")  # noqa: F821
    user_states: Mapped[list["ArticleUserState"]] = relationship(
        back_populates="article", cascade="all, delete-orphan"
    )
    reading_items: Mapped[list["ReadingItem"]] = relationship(  # noqa: F821
        back_populates="article", cascade="all, delete-orphan"
    )
    someday_items: Mapped[list["SomedayItem"]] = relationship(  # noqa: F821
        back_populates="article", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Article id={self.id} title={self.title!r}>"


class ArticleUserState(Base, TimestampMixin):
    """ユーザーごとの記事状態（既読・お気に入り）。"""

    __tablename__ = "article_user_states"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_article_user_state"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_favorited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="article_states")  # noqa: F821
    article: Mapped["Article"] = relationship(back_populates="user_states")

    def __repr__(self) -> str:
        return f"<ArticleUserState user={self.user_id} article={self.article_id}>"
