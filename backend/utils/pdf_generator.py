from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os
from datetime import datetime

def generate_patient_report(prediction_data, output_path):
    """
    Generates a PDF report for a patient's prediction.
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    story.append(Paragraph("ColonAI - Patient Assessment Report", title_style))
    story.append(Spacer(1, 12))

    # Patient Details Table
    patient_data = [
        ["Patient ID:", str(prediction_data.get('patient_id', 'N/A')), "Date:", datetime.now().strftime("%Y-%m-%d")],
        ["Age:", str(prediction_data.get('age', 'N/A')), "Gender:", str(prediction_data.get('gender', 'N/A'))],
        ["BMI:", str(prediction_data.get('bmi', 'N/A')), "Risk Level:", str(prediction_data.get('risk_level', 'N/A'))]
    ]
    
    t = Table(patient_data, colWidths=[100, 150, 100, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey)
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Image Analysis Section
    story.append(Paragraph("Image Analysis Results", styles['Heading2']))
    story.append(Paragraph(f"Predicted Disease: <b>{prediction_data.get('predicted_disease', 'N/A')}</b>", styles['Normal']))
    story.append(Paragraph(f"Confidence: {prediction_data.get('disease_confidence', 0):.2f}%", styles['Normal']))
    story.append(Spacer(1, 12))

    # Add images if available
    img_path = prediction_data.get('image_path')
    heatmap_path = prediction_data.get('heatmap_path')
    
    if img_path and os.path.exists(img_path):
        try:
            img = Image(img_path, width=200, height=200)
            story.append(Paragraph("Uploaded Image:", styles['Normal']))
            story.append(img)
            story.append(Spacer(1, 12))
        except Exception as e:
            print(f"Could not add image to PDF: {e}")
            
    if heatmap_path and os.path.exists(heatmap_path):
        try:
            heatmap_img = Image(heatmap_path, width=200, height=200)
            story.append(Paragraph("Grad-CAM Heatmap Analysis:", styles['Normal']))
            story.append(heatmap_img)
            story.append(Spacer(1, 12))
        except Exception as e:
            print(f"Could not add heatmap to PDF: {e}")

    # Clinical Risk Section
    story.append(Paragraph("Clinical Risk Assessment", styles['Heading2']))
    story.append(Paragraph(f"Overall Risk Level: <b>{prediction_data.get('risk_level', 'Unknown')}</b>", styles['Normal']))
    story.append(Paragraph(f"Estimated Probability of Cancer: {prediction_data.get('cancer_probability', 0):.2f}%", styles['Normal']))
    
    # Recommendation
    story.append(Spacer(1, 20))
    story.append(Paragraph("Personalized Recommendation", styles['Heading2']))
    
    rec_style = ParagraphStyle(
        'Recommendation',
        parent=styles['Normal'],
        backColor=colors.lightyellow,
        borderColor=colors.orange,
        borderWidth=1,
        borderPadding=10
    )
    story.append(Paragraph(prediction_data.get('recommendation', 'Consult with a healthcare professional.'), rec_style))

    # Build PDF
    doc.build(story)
    return output_path
