from django.contrib.auth import get_user_model
from ninja import Router, Schema
from ninja.errors import HttpError

from apps.api.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)

User = get_user_model()
router = Router(tags=["Authentication"])


class LoginRequest(Schema):
    username: str
    password: str


class TokenResponse(Schema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/login", response=TokenResponse, auth=None)
def login(request, payload: LoginRequest):
    user = User.objects.filter(username=payload.username).first()

    authenticated = False
    if user:
        if verify_password(payload.password, user.password):
            authenticated = True
        elif user.check_password(payload.password):
            authenticated = True
            # Rehash using bcrypt if legacy password matched
            user.password = get_password_hash(payload.password)
            user.save(update_fields=["password"])

    if not user or not authenticated:
        raise HttpError(401, "Incorrect username or password")

    if not user.is_active:
        raise HttpError(400, "Inactive user account")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
