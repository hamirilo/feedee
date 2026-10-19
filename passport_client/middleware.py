from __future__ import annotations

from django.http import HttpRequest, HttpResponse
from django.utils.encoding import iri_to_uri
from mozilla_django_oidc.middleware import SessionRefresh

from .conf import setting
from .views import public_url


class PassportSessionRefresh(SessionRefresh):
    """一定時間ごとに passport へ画面を出さずに確かめ直す（prompt=none）。

    passport で利用の許可を外した・ログアウトした・ユーザーを無効にした、を
    このプロダクトのセッションへ反映する。

    確かめ直しはページの移動（ブラウザのナビゲーション）のときだけ行う。
    htmx / fetch の途中で passport（別オリジン）へリダイレクトすると
    CORS で失敗し、部分更新が壊れるため。

    passport を通ったログインには必ず期限（`oidc_id_token_expiration`）が付く。
    期限の無いセッション（テストの force_login など）は確かめ直さない。
    """

    def is_refreshable_url(self, request: HttpRequest) -> bool:
        if "oidc_id_token_expiration" not in request.session:
            return False
        if request.headers.get("HX-Request"):
            return False
        mode = request.headers.get("Sec-Fetch-Mode")
        if mode is not None and mode != "navigate":
            return False
        return bool(super().is_refreshable_url(request))

    def process_request(self, request: HttpRequest) -> HttpResponse | None:
        response: HttpResponse | None = super().process_request(request)
        if response is None or "Location" not in response:
            return response
        # 親クラスは設定の固定 URL（`{hostname}` 入りの雛形）へ送るので、
        # アクセス元のホスト名へ差し替える。
        base, separator, params = response["Location"].partition("?")
        if base == iri_to_uri(setting("OIDC_OP_AUTHORIZATION_ENDPOINT")):
            response["Location"] = public_url(request, "/o/authorize/") + separator + params
        return response
