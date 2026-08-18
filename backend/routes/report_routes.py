import os
from flask import Blueprint, request, jsonify, send_file, current_app
from database.models import db, User, Patient, Prediction, Report
from utils.security import token_required

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user_id, current_user_role):
    if current_user_role == 'patient':
        patient = Patient.query.filter_by(user_id=current_user_id).first()
        if not patient:
            return jsonify([]), 200
            
        predictions = Prediction.query.filter_by(patient_id=patient.id).order_by(Prediction.created_at.desc()).all()
        
    elif current_user_role == 'doctor':
        # Doctors see all predictions for their assigned patients, or all if no strict assignment
        predictions = Prediction.query.order_by(Prediction.created_at.desc()).all()
    else:
        return jsonify({'message': 'Unauthorized'}), 403
        
    history = []
    for p in predictions:
        patient_record = Patient.query.get(p.patient_id)
        user_record = User.query.get(patient_record.user_id) if patient_record else None
        
        history.append({
            'id': p.id,
            'patient_name': user_record.name if user_record else 'Unknown',
            'disease': p.predicted_disease,
            'confidence': p.disease_confidence,
            'risk_level': p.risk_level,
            'date': p.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return jsonify(history), 200

@report_bp.route('/api/report/<int:prediction_id>/download', methods=['GET'])
# Note: In production, add @token_required and check ownership
def download_report(prediction_id):
    report = Report.query.filter_by(prediction_id=prediction_id).first()
    if not report:
        return jsonify({'message': 'Report not found'}), 404
        
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__name__)))
    report_path = os.path.join(base_dir, 'backend', report.pdf_path)
    
    # Check if the file path is absolute already or needs construction
    if os.path.exists(report.pdf_path):
        report_path = report.pdf_path
        
    if not os.path.exists(report_path):
        return jsonify({'message': 'PDF file not found on server'}), 404
        
    return send_file(report_path, as_attachment=True, download_name=f"ColonAI_Report_{prediction_id}.pdf")

@report_bp.route('/api/gradcam/<filename>', methods=['GET'])
def get_gradcam(filename):
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__name__)))
    gradcam_dir = os.path.join(base_dir, 'backend', 'gradcam')
    file_path = os.path.join(gradcam_dir, filename)
    
    # Fallback if running from a different working dir
    if not os.path.exists(file_path):
        file_path = os.path.join(os.getcwd(), 'gradcam', filename)
        
    if not os.path.exists(file_path):
        return jsonify({'message': 'Image not found'}), 404
        
    return send_file(file_path, mimetype='image/jpeg')

@report_bp.route('/api/delete/<int:prediction_id>', methods=['DELETE'])
@token_required
def delete_prediction(current_user_id, current_user_role, prediction_id):
    if current_user_role != 'doctor':
        return jsonify({'message': 'Only doctors can delete records'}), 403
        
    prediction = Prediction.query.get(prediction_id)
    if not prediction:
        return jsonify({'message': 'Record not found'}), 404
        
    # Delete associated report
    report = Report.query.filter_by(prediction_id=prediction_id).first()
    if report:
        db.session.delete(report)
        
    db.session.delete(prediction)
    db.session.commit()
    
    return jsonify({'message': 'Record deleted successfully'}), 200
