"""settings へ展開する設定の組み立て。

    from passport_client.conf import oidc_settings

    globals().update(
        oidc_settings(
            client_id="eigolog",
            client_secret=env("PASSPORT_CLIENT_SECRET"),
            internal_url=env("PASSPORT_INTERNAL_URL", "http://host.docker.internal:8040"),
        )
    )

AUTHENTICATION_BACKENDS / INSTALLED_APPS / MIDDLEWARE / urls と、必要なら
context processor（`passport_client.context_processors.passport`）は各プロダクトで足す
（passport の README「プロダクトへの組み込み」）。
"""

from __future__ import annotations

from typing import Any

from django.conf import settings

DEFAULT_PUBLIC_URL = "{scheme}://{hostname}:8040"
DEFAULT_ISSUER = "http://passport"


def oidc_settings(
    *,
    client_id: str,
    client_secret: str,
    internal_url: str,
    public_url: str = DEFAULT_PUBLIC_URL,
    issuer: str = DEFAULT_ISSUER,
    refresh_seconds: int = 15 * 60,
) -> dict[str, Any]:
    internal_url = internal_url.rstrip("/")
    public_url = public_url.rstrip("/")
    return {
        "PASSPORT_CLIENT_ID": client_id,
        "PASSPORT_PUBLIC_URL": public_url,
        "PASSPORT_ISSUER": issuer,
        "OIDC_RP_CLIENT_ID": client_id,
        "OIDC_RP_CLIENT_SECRET": client_secret,
        "OIDC_RP_SIGN_ALGO": "RS256",
        "OIDC_RP_SCOPES": "openid email profile",
        # ブラウザが行く先はリクエストごとに組み立てる（views / middleware）。
        "OIDC_OP_AUTHORIZATION_ENDPOINT": f"{public_url}/o/authorize/",
        "OIDC_OP_TOKEN_ENDPOINT": f"{internal_url}/o/token/",
        "OIDC_OP_USER_ENDPOINT": f"{internal_url}/o/userinfo/",
        "OIDC_OP_JWKS_ENDPOINT": f"{internal_url}/o/.well-known/jwks.json",
        "OIDC_OP_LOGOUT_URL_METHOD": "passport_client.views.provider_logout_url",
        "OIDC_AUTHENTICATE_CLASS": "passport_client.views.AuthenticationRequestView",
        "OIDC_CALLBACK_CLASS": "passport_client.views.AuthenticationCallbackView",
        "OIDC_USE_PKCE": True,
        "OIDC_STORE_ID_TOKEN": True,
        "OIDC_RENEW_ID_TOKEN_EXPIRY_SECONDS": refresh_seconds,
        # 外部 HTTP には timeout を付ける（Architecture Standard §5）。
        "OIDC_TIMEOUT": 10,
        "LOGIN_URL": "oidc_authentication_init",
        # ログアウトの戻り先。passport からもログアウトするときは passport が
        # post_logout_redirect_uri（このプロダクトの `/`）へ戻すので、使うのは未ログイン時だけ。
        # Django の既定値は None で、mozilla-django-oidc のログアウトが落ちる。
        "LOGOUT_REDIRECT_URL": "/",
        "LOGIN_REDIRECT_URL_FAILURE": "passport_denied",
        # 各プロダクトは同じホストの別ポートで動き、Cookie はポートで分かれない。
        # 既定名 `sessionid` のままだとプロダクト同士でセッションを上書きし合う。
        "SESSION_COOKIE_NAME": f"{client_id}_sessionid",
    }


def setting(name: str, default: Any = None) -> Any:
    """oidc_settings() が足した設定を読む。

    各プロダクトの settings モジュールは型検査（django-stubs）から見えないので、
    属性として直接は読まない。
    """
    return getattr(settings, name, default)
