import os
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, Unauthorized
import bcrypt
import jwt
from bson import ObjectId

from db import get_db


auth_bp = Blueprint("auth", __name__)


def _jwt_secret():
    return os.getenv("JWT_SECRET", "dev-secret-key")


def _generate_token(user_id: str):
    payload = {
        "sub": user_id,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def _decode_token(token: str):
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        raise BadRequest("name, email y password son requeridos")

    db = get_db()
    users = db["users"]

    if users.find_one({"email": email}):
        raise BadRequest("El email ya está registrado")

    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user_doc = {
        "name": name,
        "email": email,
        "password": pw_hash,  # bytes
        "created_at": datetime.datetime.utcnow(),
    }
    res = users.insert_one(user_doc)

    user_id = str(res.inserted_id)
    token = _generate_token(user_id)

    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        raise BadRequest("email y password son requeridos")

    db = get_db()
    user = db["users"].find_one({"email": email})
    if not user:
        raise Unauthorized("Credenciales inválidas")

    pw_hash = user.get("password")
    if not pw_hash or not bcrypt.checkpw(password.encode("utf-8"), pw_hash):
        raise Unauthorized("Credenciales inválidas")

    user_id = str(user["_id"]) 
    token = _generate_token(user_id)

    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "name": user.get("name"),
            "email": user.get("email"),
        }
    })


@auth_bp.route("/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Unauthorized("Token requerido")
    token = auth_header.split(" ", 1)[1]

    try:
        payload = _decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise Unauthorized("Token inválido")
    except jwt.ExpiredSignatureError:
        raise Unauthorized("Token expirado")
    except jwt.InvalidTokenError:
        raise Unauthorized("Token inválido")

    db = get_db()
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise Unauthorized("Usuario no encontrado")

    return jsonify({
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
    })

