import uuid
from enum import Enum as PyEnum

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class BookmarkType(str, PyEnum):
    RESOURCE = "resource"   # リソース型：必要な時に参照するURL（ツール集・アイコン配布サイト等）
    CONTENT = "content"     # コンテンツ型：内容が良くて記憶に残したいもの（コラム・記事等）


class Bookmark(Base, TimestampMixin):
    """ブックマーク（永久保存）。リソース型とコンテンツ型を明確に分離。"""

    __tablename__ = "bookmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    bookmark_type: Mapped[BookmarkType] = mapped_column(
        String(20), nullable=False, default=BookmarkType.CONTENT
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    title: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    user: Mapped["User"] = relationship(back_populates="bookmarks")  # noqa: F821
    category: Mapped["Category | None"] = relationship(back_populates="bookmarks")  # noqa: F821
    tags: Mapped[list["Tag"]] = relationship(  # noqa: F821
        secondary="bookmark_tags", back_populates="bookmarks"
    )
    user_state: Mapped["BookmarkUserState | None"] = relationship(
        back_populates="bookmark", cascade="all, delete-orphan", uselist=False
    )

    def __repr__(self) -> str:
        return f"<Bookmark id={self.id} type={self.bookmark_type} url={self.url!r}>"


class BookmarkUserState(Base, TimestampMixin):
    """ブックマークのユーザー状態（ピン留め・お気に入り）。"""

    __tablename__ = "bookmark_user_states"
    __table_args__ = (
        UniqueConstraint("user_id", "bookmark_id", name="uq_bookmark_user_state"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bookmark_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookmarks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_favorited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # relationships
    bookmark: Mapped["Bookmark"] = relationship(back_populates="user_state")

    def __repr__(self) -> str:
        return f"<BookmarkUserState user={self.user_id} bookmark={self.bookmark_id}>"
