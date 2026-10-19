"""プロダクトの urls.py で `path("oidc/", include("passport_client.urls"))` として置く。

Django Admin のログイン画面も passport へ回すため、admin より前に
`path("admin/login/", passport_client.views.admin_login)` を置く。

どの URL も未ログインで開く（コールバック・拒否画面）。Django の
LoginRequiredMiddleware を使うプロダクトでもログインへ回し続けないよう、
`login_not_required` を付けておく。
"""

from django.contrib.auth.decorators import login_not_required
from django.urls import path
from mozilla_django_oidc import urls as oidc_urls
from mozilla_django_oidc.views import OIDCLogoutView

from . import views

urlpatterns = [
    path(
        "callback/",
        login_not_required(oidc_urls.OIDCCallbackClass.as_view()),
        name="oidc_authentication_callback",
    ),
    path(
        "authenticate/",
        login_not_required(oidc_urls.OIDCAuthenticateClass.as_view()),
        name="oidc_authentication_init",
    ),
    path("logout/", login_not_required(OIDCLogoutView.as_view()), name="oidc_logout"),
    path("denied/", views.denied, name="passport_denied"),
]
