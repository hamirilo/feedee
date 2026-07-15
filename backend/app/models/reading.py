import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class ReadingItem(Base, TimestampMixin):
    """あとで読む（Inbox）。RSS記事・URL直接入力・ブックマークレットから追加。"""

    __tablename__ = "reading_items"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_reading_item_user_article"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # RSS記事由来の場合は article_id を持つ（URL直接入力の場合は NULL）
    article_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    # URL直接入力・ブックマークレット由来の場合は以下フィールドを使用
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # relationships
    user: Mapped["User"] = relationship(back_populates="reading_items")  # noqa: F821
    article: Mapped["Article | None"] = relationship(back_populates="reading_items")  # noqa: F821

    def __repr__(self) -> str:
        return f"<ReadingItem id={self.id} user={self.user_id}>"


class SomedayItem(Base, TimestampMixin):
    """そのうち読む（Someday）。あとで読むの第2段階。"""

    __tablename__ = "someday_items"
    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_someday_item_user_article"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    user: Mapped["User"] = relationship(back_populates="someday_items")  # noqa: F821
    article: Mapped["Article | None"] = relationship(back_populates="someday_items")  # noqa: F821

    def __repr__(self) -> str:
        return f"<SomedayItem id={self.id} user={self.user_id}>"
