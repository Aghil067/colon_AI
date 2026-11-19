from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from database.models import db, User
from utils.security import generate_token, token_required

auth_bp = Blueprint("auth_bp", __name__)


def public_user(user):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@auth_bp.post("/api/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(message="Provide account details."), 400
    name, email, password, role = (data.get(key) for key in ("name", "email", "password", "role"))
    if not all(isinstance(value, str) for value in (name, email, password, role)):
        return jsonify(message="Provide name, email, password and role."), 400
    name, email = name.strip(), email.strip().lower()
    if not (1 <= len(name) <= 100 and 3 <= len(email) <= 120 and "@" in email
            and 8 <= len(password) <= 128 and role in {"doctor", "patient"}):
        return jsonify(message="Enter valid account details and a password of 8–128 characters."), 400
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(message="An account already exists for this email."), 409
    return jsonify(message="Account created."), 201


@auth_bp.post("/api/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(message="Provide email and password."), 400
    email, password = data.get("email"), data.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or len(password) > 128:
        return jsonify(message="Provide email and password."), 400
    user = User.query.filter_by(email=email.strip().lower()).first()
    if user is None or not user.check_password(password):
        return jsonify(message="Invalid email or password."), 401
    return jsonify(token=generate_token(user), user=public_user(user))


@auth_bp.get("/api/me")
@token_required
def me(user):
    return jsonify(public_user(user))
