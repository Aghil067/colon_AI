from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, jsonify, request

from database.models import db, User


def generate_token(user):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user.id), "iat": now, "exp": now + timedelta(days=1)},
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def token_required(handler):
    @wraps(handler)
    def decorated(*args, **kwargs):
        scheme, _, token = request.headers.get("Authorization", "").partition(" ")
        if scheme.lower() != "bearer" or not token:
            return jsonify(message="Sign in to continue."), 401
        try:
            claims = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"],
                                options={"require": ["sub", "exp"]})
            user = db.session.get(User, int(claims["sub"]))
        except (jwt.InvalidTokenError, ValueError, TypeError):
            return jsonify(message="Your session has expired. Sign in again."), 401
        if user is None:
            return jsonify(message="Your session has expired. Sign in again."), 401
        return handler(user, *args, **kwargs)

    return decorated
