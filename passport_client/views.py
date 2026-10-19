from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from django.contrib.auth.decorators import login_not_required
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import render, resolve_url
from django.urls import reverse
from mozilla_django_oidc.views import (
    OIDCAuthenticationCallbackView,
    OIDCAuthenticationRequestView,
)

from .conf import setting

# passport がログインし直しを求めているだけのエラー（画面を出さない確認が通らなかった）。
LOGIN_AGAIN_ERRORS = {"login_required", "interaction_required", "consent_required"}


def request_hostname(request: HttpRequest) -> str:
    """Host ヘッダーからポートを除いたもの（IPv6 の `[::1]` はそのまま）。"""
    host = request.get_host()
    if host.startswith("["):
        return host[: host.index("]") + 1]
    return host.split(":", 1)[0]


def public_url(request: HttpRequest, path: str = "/") -> str:
    """ブラウザから見た passport の URL。アクセス元と同じホスト名へ向ける。"""
    base = setting("PASSPORT_PUBLIC_URL").format(scheme=request.scheme, hostname=request_hostname(request))
    return base + path


class AuthenticationRequestView(OIDCAuthenticationRequestView):
    def get(self, request: HttpRequest) -> HttpResponse:
        # ビューのインスタンスはリクエストごとに作られるので、ここで書き換えてよい。
        self.OIDC_OP_AUTH_ENDPOINT = public_url(request, "/o/authorize/")
        return super().get(request)


class AuthenticationCallbackView(OIDCAuthenticationCallbackView):
    @property
    def failure_url(self) -> str:
        # 親クラスは設定値をそのまま返すので、URL 名（passport_denied）を解決する。
        return resolve_url(self.get_settings("LOGIN_REDIRECT_URL_FAILURE", "/"))

    def get(self, request: HttpRequest) -> HttpResponse:
        error = request.GET.get("error")
        if error not in LOGIN_AGAIN_ERRORS:
            return super().get(request)
        # passport 側でログアウトした・セッションが切れた。このプロダクトからも
        # ログアウトさせたうえで、元の画面へ戻る前提でログインし直してもらう。
        next_url = request.session.get("oidc_login_next") or "/"
        super().get(request)
        return HttpResponseRedirect(reverse("oidc_authentication_init") + "?" + urlencode({"next": next_url}))


def provider_logout_url(request: HttpRequest) -> str:
    """このプロダクトからのログアウトで passport からもログアウトさせる。"""
    params = {
        "client_id": setting("PASSPORT_CLIENT_ID"),
        "post_logout_redirect_uri": request.build_absolute_uri("/"),
    }
    id_token = request.session.get("oidc_id_token")
    if id_token:
        params["id_token_hint"] = id_token
    return public_url(request, "/o/logout/") + "?" + urlencode(params)


@login_not_required
def denied(request: HttpRequest) -> HttpResponse:
    template = setting("PASSPORT_DENIED_TEMPLATE", "passport_client/denied.html")
    context: dict[str, Any] = {
        "product": setting("PASSPORT_CLIENT_ID"),
        "passport_url": public_url(request, "/"),
        "retry_url": reverse("oidc_authentication_init"),
    }
    return render(request, template, context, status=403)


@login_not_required
def admin_login(request: HttpRequest) -> HttpResponse:
    """Django Admin のログイン画面の代わり。passport でのログインへ回す。"""
    next_url = request.GET.get("next", reverse("admin:index"))
    return HttpResponseRedirect(reverse("oidc_authentication_init") + "?" + urlencode({"next": next_url}))
