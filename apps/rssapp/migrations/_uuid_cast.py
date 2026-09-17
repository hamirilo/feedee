"""bigint の主キーを UUID へ変換する AlterField。

PostgreSQL には bigint から uuid への cast が無く、Django が既定で出す

    ALTER TABLE "articles" ALTER COLUMN "id" TYPE uuid USING "id"::uuid

は ``cannot cast type bigint to uuid`` で失敗する。SQLite はテーブルを作り直すため
通ってしまい、0019 の主キー変更がこの形のまま残っていた（PostgreSQL では空の DB でも
失敗するため、新しい環境を立ち上げられない状態だった）。

``lpad(to_hex(id), 32, '0')::uuid`` は 10 進の値をそのまま 16 進の UUID へ移す。
1 対 1 で衝突せず、主キーと、それを指す外部キーへ同じ式が当たるため、既存行の
参照関係は変換後もそのまま保たれる（1 → 00000000-0000-0000-0000-000000000001）。
行が無ければ単なる型変更になる。
"""

from contextlib import contextmanager
from types import MethodType

from django.db import migrations

# 変換元として許す DB 型。FK の列は参照先の主キーと同じ型を持つ。
_INTEGER_DB_TYPES = frozenset({"integer", "bigint", "smallint", "serial", "bigserial", "smallserial"})

_UUID_FROM_INTEGER = " USING lpad(to_hex(%(column)s), 32, '0')::%(type)s"


@contextmanager
def integer_to_uuid_cast(schema_editor):
    """この schema editor が出す整数 → uuid の USING 句を差し替える。"""
    if schema_editor.connection.vendor != "postgresql":
        # SQLite はテーブルを作り直すため USING 句を使わない。
        yield
        return

    original = schema_editor._using_sql

    def _using_sql(self, new_field, old_field):
        if _db_type(self, new_field) == "uuid" and _db_type(self, old_field) in _INTEGER_DB_TYPES:
            return _UUID_FROM_INTEGER
        return original(new_field, old_field)

    schema_editor._using_sql = MethodType(_using_sql, schema_editor)
    try:
        yield
    finally:
        schema_editor._using_sql = original


def _db_type(schema_editor, field):
    db_type = field.db_parameters(connection=schema_editor.connection).get("type") or ""
    return db_type.split("(")[0].strip().lower()


class AlterFieldToUUID(migrations.AlterField):
    """主キーを bigint から UUID へ変える AlterField。

    Django は主キーの型を変えるとき、それを指す外部キーの列も同じ操作の中で
    変換する。差し替えた USING 句は同じ schema editor を通るその変換にも効く。
    """

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        with integer_to_uuid_cast(schema_editor):
            super().database_forwards(app_label, schema_editor, from_state, to_state)
