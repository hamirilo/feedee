from __future__ import annotations

from django.http import HttpRequest

from .views import public_url


def passport(request: HttpRequest) -> dict[str, str]:
    """テンプレートから passport（アカウント・パスワード・使えるプロダクト）へリンクする。"""
    return {
        "passport_url": public_url(request, "/"),
        "passport_password_url": public_url(request, "/password/"),
    }
