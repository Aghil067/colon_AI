from datetime import datetime, timezone
import hashlib
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
import uuid

from flask import Blueprint, current_app, jsonify, request, send_file
from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError
from sqlalchemy import or_, update

from database.models import Assessment, User, db
from utils.image_model import CLASSES, DATASET_NAME, DATASET_URL
from utils.pdf_generator import assessment_pdf
from utils.public_demo import DEMO_FILES
from utils.security import token_required

study_bp = Blueprint("study", __name__)
SOURCES = {"user-upload", "public-research"}


def timestamp(value):
    return value.replace(tzinfo=timezone.utc).isoformat() if value else None


def files_for(image_key):
    directory = Path(current_app.config["STUDY_FILES"])
    return directory / f"{image_key}.jpg", directory / f"{image_key}-gradcam.jpg"


def view(case):
    image, overlay = files_for(case.image_key)
    return {
        "id": case.id,
        "patient_name": case.owner.name,
        "created_at": timestamp(case.created_at),
        "source": case.source,
        "sha256": case.sha256,
        "image_details": case.image_details,
        "inference": case.inference,
        "image_url": f"/api/assessments/{case.id}/image" if image.exists() else None,
        "heatmap_url": f"/api/assessments/{case.id}/heatmap" if overlay.exists() else None,
        "reviewer": case.reviewer.name if case.reviewer else None,
        "reviewer_email": case.reviewer.email if case.reviewer else None,
        "review_note": case.review_note,
        "reviewed_at": timestamp(case.reviewed_at),
    }


def visible_cases(user):
    return Assessment.query.filter(or_(Assessment.owner_id == user.id, Assessment.reviewer_id == user.id))


@study_bp.after_request
def private_response(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@study_bp.get("/api/status")
def status():
    classifier = current_app.extensions["image_classifier"]
    return jsonify(
        api="online",
        image_classifier=classifier.status,
        dataset={"name": DATASET_NAME, "url": DATASET_URL, "classes": CLASSES},
        evaluation=classifier.metadata,
        risk_tool={"name": "NCI Colorectal Cancer Risk Assessment Tool", "url": "https://ccrisktool.cancer.gov/"},
    )


@study_bp.get("/api/demo")
def public_demo():
    demo = current_app.extensions["public_demo"]
    if demo is None:
        return jsonify(message="The public demo is unavailable."), 404
    return jsonify(**demo, image_url="/api/demo/image",
                   heatmap_url="/api/demo/heatmap" if demo["heatmap_sha256"] else None)


@study_bp.get("/api/demo/<kind>")
def public_demo_file(kind):
    demo = current_app.extensions["public_demo"]
    if demo is None or kind not in DEMO_FILES or not demo[f"{kind}_sha256"]:
        return jsonify(message="The public demo is unavailable."), 404
    path = Path(current_app.config["MODEL_DIR"]) / DEMO_FILES[kind]
    if not path.is_file():
        return jsonify(message="The public demo is unavailable."), 404
    return send_file(path, mimetype="image/jpeg")


@study_bp.get("/api/assessments")
@token_required
def list_cases(user):
    cases = visible_cases(user).order_by(Assessment.created_at.desc(), Assessment.id.desc()).all()
    return jsonify([view(case) for case in cases])


@study_bp.post("/api/assessments")
@study_bp.post("/api/predict-combined")
@token_required
def create_case(user):
    if user.role != "patient":
        return jsonify(message="Use a patient account to upload an assessment."), 403
    if request.form.get("age"):
        return jsonify(message="Clinical risk estimates are unavailable in ColonAI. Use the NCI reference tool."), 422
    upload = request.files.get("image")
    source = request.form.get("source", "user-upload")
    if upload is None or source not in SOURCES:
        return jsonify(message="Select a JPEG or PNG and its source."), 400

    source_url = request.form.get("source_url", "").strip() if source == "public-research" else None
    if source_url is not None:
        try:
            parsed = urlsplit(source_url)
            if (len(source_url) > 500 or parsed.scheme != "https" or not parsed.hostname
                    or parsed.username or parsed.password or any(char.isspace() for char in source_url)):
                raise ValueError("Invalid dataset URL")
        except ValueError:
            return jsonify(message="Provide the public dataset's HTTPS URL."), 400

    original = upload.read()
    try:
        with Image.open(BytesIO(original)) as uploaded:
            if uploaded.format not in {"JPEG", "PNG"} or uploaded.width * uploaded.height > 20_000_000:
                return jsonify(message="Upload a JPEG or PNG up to 20 megapixels."), 400
            image_format = uploaded.format
            image = ImageOps.exif_transpose(uploaded).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, SyntaxError):
        return jsonify(message="This file could not be read as a JPEG or PNG."), 400

    grayscale = image.convert("L")
    luminance = ImageStat.Stat(grayscale)
    key = uuid.uuid4().hex
    image_path, heatmap_path = files_for(key)
    image_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        image.save(image_path, "JPEG", quality=94)
        classifier = current_app.extensions["image_classifier"]
        inference = classifier.predict(image_path, heatmap_path)
        case = Assessment(
            owner_id=user.id,
            image_key=key,
            sha256=hashlib.sha256(original).hexdigest(),
            source=source,
            image_details={
                "width": image.width,
                "height": image.height,
                "format": image_format,
                "bytes": len(original),
                "brightness": round(luminance.mean[0], 1),
                "contrast": round(luminance.stddev[0], 1),
                "source_url": source_url,
            },
            inference=inference,
        )
        db.session.add(case)
        db.session.commit()
    except Exception:
        db.session.rollback()
        image_path.unlink(missing_ok=True)
        heatmap_path.unlink(missing_ok=True)
        current_app.logger.exception("Assessment processing failed.")
        return jsonify(message="The assessment could not be processed. Try again."), 500
    prior_id = db.session.scalar(
        db.select(Assessment.id).where(Assessment.owner_id == user.id, Assessment.sha256 == case.sha256,
                                       Assessment.id < case.id).order_by(Assessment.id).limit(1)
    )
    return jsonify(**view(case), duplicate_of=prior_id), 201


@study_bp.get("/api/assessments/<int:case_id>/<kind>")
@token_required
def download_case_file(user, case_id, kind):
    case = visible_cases(user).filter_by(id=case_id).first()
    if not case or kind not in {"image", "heatmap", "report"}:
        return jsonify(message="Assessment file not found."), 404
    image, overlay = files_for(case.image_key)
    if kind == "report":
        pdf = assessment_pdf(view(case), image, overlay)
        return send_file(pdf, mimetype="application/pdf", as_attachment=True,
                         download_name=f"ColonAI_Assessment_{case.id}.pdf")
    path = image if kind == "image" else overlay
    if not path.is_file():
        return jsonify(message="Assessment file not found."), 404
    return send_file(path, mimetype="image/jpeg")


@study_bp.put("/api/assessments/<int:case_id>/sharing")
@token_required
def share_case(user, case_id):
    case = Assessment.query.filter_by(id=case_id, owner_id=user.id).first()
    if not case:
        return jsonify(message="Assessment not found."), 404
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("email"), str):
        return jsonify(message="Provide the reviewer's account email."), 400
    email = data["email"].strip().lower()
    reviewer = User.query.filter_by(email=email, role="doctor").first() if email else None
    if email and reviewer is None:
        return jsonify(message="No reviewer account has that email."), 404
    reviewer_id = reviewer.id if reviewer else None
    if reviewer_id != case.reviewer_id:
        case.reviewer = reviewer
        case.review_note = None
        case.reviewed_at = None
        db.session.commit()
    return jsonify(view(case))


@study_bp.put("/api/assessments/<int:case_id>/review")
@token_required
def save_review(user, case_id):
    if user.role != "doctor":
        return jsonify(message="A reviewer account is required."), 403
    data = request.get_json(silent=True)
    note = data.get("note") if isinstance(data, dict) else None
    if not isinstance(note, str) or not 1 <= len(note.strip()) <= 2000:
        return jsonify(message="Enter a review note between 1 and 2,000 characters."), 400
    result = db.session.execute(
        update(Assessment).where(Assessment.id == case_id, Assessment.reviewer_id == user.id)
        .values(review_note=note.strip(), reviewed_at=datetime.now(timezone.utc).replace(tzinfo=None))
    )
    if not result.rowcount:
        db.session.rollback()
        return jsonify(message="Assessment not found."), 404
    db.session.commit()
    return jsonify(view(db.session.get(Assessment, case_id)))
