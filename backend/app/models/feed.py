import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Feed(Base, TimestampMixin):
    """RSSフィード（URL単位・システムグローバル）。複数ユーザーが同一フィードを購読可能。"""

    __tablename__ = "feeds"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    site_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_fetched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fetch_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    etag: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_modified: Mapped[str | None] = mapped_column(String(255), nullable=True)


    # relationships
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="feed", cascade="all, delete-orphan"
    )
    articles: Mapped[list["Article"]] = relationship(  # noqa: F821
        back_populates="feed", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Feed id={self.id} url={self.url!r}>"


class Subscription(Base, TimestampMixin):
    """ユーザーとフィードの購読関係。カテゴリ・表示名・並び順はユーザー固有。"""

    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "feed_id", name="uq_subscription_user_feed"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feeds.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    display_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="subscriptions")  # noqa: F821
    feed: Mapped["Feed"] = relationship(back_populates="subscriptions")
    category: Mapped["Category | None"] = relationship(  # noqa: F821
        back_populates="subscriptions"
    )

    def __repr__(self) -> str:
        return f"<Subscription user={self.user_id} feed={self.feed_id}>"
