"""add archive to reading

Revision ID: 0002_add_archive_to_reading
Revises: 0001_initial
Create Date: 2026-07-15 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_add_archive_to_reading"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "reading_items",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "reading_items",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reading_items_is_archived", "reading_items", ["is_archived"])


def downgrade() -> None:
    op.drop_index("ix_reading_items_is_archived", table_name="reading_items")
    op.drop_column("reading_items", "archived_at")
    op.drop_column("reading_items", "is_archived")
