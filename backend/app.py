from __future__ import annotations

import os
import secrets
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from database.models import db
from routes.auth_routes import auth_bp
from routes.study_routes import study_bp
from utils.image_model import ImageClassifier
from utils.public_demo import load_public_demo

BASE_DIR = Path(__file__).resolve().parent


def create_app(config=None):
    data_dir = Path(os.environ.get("COLONAI_DATA_DIR", str(BASE_DIR / "instance"))).resolve()
    app = Flask(__name__, static_folder=None, instance_path=str(data_dir))
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
        SQLALCHEMY_DATABASE_URI="sqlite:///" + str(data_dir / "colonai.sqlite3"),
        MAX_CONTENT_LENGTH=12 * 1024 * 1024,
        STUDY_FILES=data_dir / "assessments",
        MODEL_DIR=BASE_DIR / "trained_models" / "kvasir_public",
        FRONTEND_DIR=BASE_DIR.parent / "frontend" / "dist",
    )
    if config:
        app.config.update(config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(study_bp)
    classifier = ImageClassifier(app.config["MODEL_DIR"], app.logger)
    app.extensions["image_classifier"] = classifier
    app.extensions["public_demo"] = load_public_demo(classifier)
    with app.app_context():
        db.create_all()

    @app.errorhandler(413)
    def upload_too_large(_error):
        return jsonify(message="Upload a JPEG or PNG smaller than 12 MB."), 413

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def frontend(path):
        if path == "api" or path.startswith("api/"):
            return jsonify(message="Endpoint not found."), 404
        directory = Path(app.config["FRONTEND_DIR"])
        if path.startswith("assets/") or path in {"favicon.svg", "icons.svg"}:
            return send_from_directory(directory, path)
        if (directory / "index.html").is_file():
            return send_from_directory(directory, "index.html")
        return "Build the frontend or open the Vite development server.", 404

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000)
