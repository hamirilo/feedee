import uuid
from enum import Enum as PyEnum

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class CategoryScope(str, PyEnum):
    RSS = "rss"
    BOOKMARK = "bookmark"


class Category(Base, TimestampMixin):
    """フラット構造のカテゴリ。フィード購読とブックマークで共通利用。"""

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#6b7280")  # hex color
    scope: Mapped[CategoryScope] = mapped_column(
        String(20), nullable=False, default=CategoryScope.RSS
    )

    # relationships
    user: Mapped["User"] = relationship(back_populates="categories")  # noqa: F821
    subscriptions: Mapped[list["Subscription"]] = relationship(  # noqa: F821
        back_populates="category"
    )
    bookmarks: Mapped[list["Bookmark"]] = relationship(  # noqa: F821
        back_populates="category"
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r}>"


# Bookmark と Tag の多対多中間テーブル
bookmark_tag_association = __import__("sqlalchemy").Table(
    "bookmark_tags",
    Base.metadata,
    __import__("sqlalchemy").Column(
        "bookmark_id",
        UUID(as_uuid=True),
        ForeignKey("bookmarks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    __import__("sqlalchemy").Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base, TimestampMixin):
    """タグ。Bookmark のみに付与可能。複数付与可。"""

    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#6b7280")

    # relationships
    user: Mapped["User"] = relationship(back_populates="tags")  # noqa: F821
    bookmarks: Mapped[list["Bookmark"]] = relationship(  # noqa: F821
        secondary="bookmark_tags", back_populates="tags"
    )

    def __repr__(self) -> str:
        return f"<Tag id={self.id} name={self.name!r}>"
