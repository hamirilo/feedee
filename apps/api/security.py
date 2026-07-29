import datetime
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from ninja.security import HttpBearer

User = get_user_model()

SECRET_KEY = getattr(settings, "SECRET_KEY", "change-me-to-a-random-secret-key")
ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return check_password(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return make_password(password)


def create_access_token(data: dict, expires_delta: datetime.timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(minutes=60 * 24 * 7)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    return create_access_token(data=data, expires_delta=datetime.timedelta(days=30))


class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                return None
            user = User.objects.filter(username=username).first()
            if user is None or not user.is_active:
                return None
            return user
        except jwt.PyJWTError:
            return None


class WorkerAuth(HttpBearer):
    def authenticate(self, request, token):
        worker_token = getattr(settings, "WORKER_API_TOKEN", "")
        if not worker_token:
            return True
        if token == worker_token:
            return True
        return None


jwt_auth = JWTAuth()
worker_auth = WorkerAuth()
