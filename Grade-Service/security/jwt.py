"""JWT utilities and middleware for request authentication."""
from __future__ import annotations

import os
from typing import Callable

import jwt
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def verify_jwt_token(token: str) -> dict:
    """Decode and verify a JWT. Raises jwt exceptions on failure."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


class JWTMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces Bearer token presence and validity."""

    def __init__(self, app, exempt_paths: tuple[str, ...] | None = None):
        super().__init__(app)
        self.exempt_paths = exempt_paths or ("/docs", "/openapi.json", "/health", "/redoc")

    async def dispatch(self, request: Request, call_next: Callable):
        path = request.url.path
        if any(path.startswith(exempt) for exempt in self.exempt_paths):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid Authorization header"},
            )

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = verify_jwt_token(token)
            request.state.user = payload
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Token expired"}
            )
        except jwt.InvalidTokenError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Invalid token"}
            )

        return await call_next(request)

