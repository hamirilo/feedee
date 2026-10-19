from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import SuspiciousOperation
from mozilla_django_oidc.auth import OIDCAuthenticationBackend

from .conf import setting

logger = logging.getLogger(__name__)


class PassportBackend(OIDCAuthenticationBackend):
    """passport の ID トークンでログインさせる。ローカルのパスワードでは入れない。

    ModelBackend を継承しているので、Django Admin の権限判定（has_perm）はそのまま効く。
    """

    def verify_token(self, token: str, **kwargs: Any) -> dict[str, Any]:
        payload: dict[str, Any] = super().verify_token(token, **kwargs)
        audience = payload.get("aud")
        audiences = audience if isinstance(audience, list) else [audience]
        if setting("PASSPORT_CLIENT_ID") not in audiences:
            raise SuspiciousOperation("ID トークンの aud がこのプロダクトではない")
        if payload.get("iss") != setting("PASSPORT_ISSUER"):
            raise SuspiciousOperation("ID トークンの iss が passport ではない")
        return payload

    def verify_claims(self, claims: dict[str, Any]) -> bool:
        if not claims.get("email"):
            return False
        if setting("PASSPORT_CLIENT_ID") not in claims.get("apps", []):
            logger.warning(
                "passport はこのプロダクトの利用を許可していない",
                extra={"email": claims.get("email")},
            )
            return False
        return True

    def create_user(self, claims: dict[str, Any]) -> Any:
        email = claims["email"]
        user = self.UserModel(email=email)
        username_field = self.UserModel.USERNAME_FIELD
        if username_field != "email":
            setattr(user, username_field, email)
        user.set_unusable_password()
        user.save()
        return user
