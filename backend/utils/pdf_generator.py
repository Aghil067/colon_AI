from io import BytesIO
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def assessment_pdf(case, image_path, overlay_path):
    output = BytesIO()
    styles = getSampleStyleSheet()
    details = case["image_details"]
    elements = [
        Paragraph(f"ColonAI assessment #{case['id']}", styles["Title"]),
        Paragraph(escape(case["patient_name"]), styles["Heading2"]),
        Paragraph(f"Captured in ColonAI at {escape(case['created_at'])}", styles["Normal"]),
        Paragraph("Academic research record. Use clinical judgment for healthcare decisions.", styles["Normal"]),
        Spacer(1, 14),
        Paragraph("Image provenance", styles["Heading2"]),
        Paragraph(f"Declared source: {case['source']}", styles["Normal"]),
        Paragraph(f"{details['format']} · {details['width']} × {details['height']} pixels · {details['bytes']:,} bytes", styles["Normal"]),
        Paragraph(f"Original SHA-256: {case['sha256']}", styles["Normal"]),
        Spacer(1, 14),
    ]
    if details.get("source_url"):
        elements.insert(-1, Paragraph(f"Declared dataset URL: {escape(details['source_url'])}", styles["Normal"]))

    def panel(path, caption):
        with PILImage.open(path) as image:
            width, height = image.size
        scale = min(215 / width, 170 / height)
        return [Paragraph(caption, styles["Heading3"]), Image(str(path), width * scale, height * scale)]

    panels = []
    if image_path.is_file():
        panels.append(panel(image_path, "Submitted image"))
    if overlay_path.is_file():
        panels.append(panel(overlay_path, "Grad-CAM overlay"))
    if panels:
        table = Table([panels], colWidths=[230] * len(panels), hAlign="LEFT")
        table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                   ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f1f5f9"))]))
        elements.append(table)

    elements.append(Paragraph("Image classifier", styles["Heading2"]))
    inference = case["inference"]
    if inference:
        elements.append(Paragraph(f"Training source: {escape(inference['dataset'])}", styles["Normal"]))
        elements.append(Paragraph(f"Model SHA-256: {inference['model_sha256']}", styles["Normal"]))
        for item in inference["classes"]:
            elements.append(Paragraph(
                f"{escape(item['label'])}: {item['score']:.1%} model score", styles["Normal"]))
    else:
        elements.append(Paragraph("Classification unavailable for this assessment.", styles["Normal"]))

    elements.append(Paragraph("Reviewer note", styles["Heading2"]))
    if case["review_note"]:
        elements.extend([
            Paragraph(f"{escape(case['reviewer'])} · {escape(case['reviewed_at'])}", styles["Normal"]),
            Paragraph(escape(case["review_note"]).replace("\n", "<br/>"), styles["Normal"]),
        ])
    else:
        elements.append(Paragraph("No reviewer note recorded.", styles["Normal"]))
    SimpleDocTemplate(output, pagesize=letter, title=f"ColonAI assessment {case['id']}").build(elements)
    output.seek(0)
    return output
