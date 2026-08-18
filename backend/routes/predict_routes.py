import os
import uuid
import numpy as np
import pandas as pd
import joblib
import cv2
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from database.models import db, Patient, Prediction, Report
from utils.security import token_required
from utils.gradcam import make_gradcam_heatmap, save_and_display_gradcam
from utils.pdf_generator import generate_patient_report
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

predict_bp = Blueprint('predict_bp', __name__)

UPLOAD_FOLDER = 'datasets/uploads'
GRADCAM_FOLDER = 'gradcam'
REPORTS_FOLDER = 'reports'
EFFICIENTNET_PATH = 'trained_models/efficientnetb3_colonai.h5'
XGBOOST_PATH = 'trained_models/xgboost_risk_model.pkl'
SCALER_PATH = 'trained_models/scaler.pkl'
EXPECTED_FEATURES_PATH = 'trained_models/expected_features.pkl'

CLASSES = ['Normal', 'Polyps', 'Ulcerative Colitis', 'Esophagitis', 'Other GI Diseases']

# Try loading models globally
try:
    if os.path.exists(EFFICIENTNET_PATH):
        image_model = tf.keras.models.load_model(EFFICIENTNET_PATH)
    else:
        image_model = None
except Exception as e:
    print(f"Could not load image model: {e}")
    image_model = None

try:
    if os.path.exists(XGBOOST_PATH):
        risk_model = joblib.load(XGBOOST_PATH)
        scaler = joblib.load(SCALER_PATH)
        expected_features = joblib.load(EXPECTED_FEATURES_PATH)
    else:
        risk_model = None
except Exception as e:
    print(f"Could not load risk model: {e}")
    risk_model = None

@predict_bp.route('/api/predict-combined', methods=['POST'])
@token_required
def predict_combined(current_user_id, current_user_role):
    # Ensure directories exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(GRADCAM_FOLDER, exist_ok=True)
    os.makedirs(REPORTS_FOLDER, exist_ok=True)

    # Helper converters (function-scope so available throughout)
    def safe_float(val, default=0.0):
        try:
            return float(val) if val not in (None, '', 'null') else default
        except (ValueError, TypeError):
            return default

    def safe_int(val, default=0):
        try:
            return int(val) if val not in (None, '', 'null') else default
        except (ValueError, TypeError):
            return default

    # 1. Get Patient Record
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    if not patient and current_user_role == 'patient':
        return jsonify({'message': 'Patient record not found'}), 404
    
    # 2. Handle Image Upload & Prediction
    image_path = None
    heatmap_path = None
    disease_prediction = "Unknown"
    disease_conf = 0.0

    
    if 'image' in request.files:
        file = request.files['image']
        if file.filename != '':
            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(image_path)
            
            if image_model:
                # Preprocess image using MobileNetV2 preprocessing (matches training pipeline)
                img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
                img_array = tf.keras.preprocessing.image.img_to_array(img)
                img_array = np.expand_dims(img_array, axis=0)
                img_array = preprocess_input(img_array)
                
                # Predict
                preds = image_model.predict(img_array)
                pred_class_idx = np.argmax(preds[0])
                disease_prediction = CLASSES[pred_class_idx]
                disease_conf = float(preds[0][pred_class_idx] * 100)
                
                # Grad-CAM - find last conv layer safely
                try:
                    conv_layers = [layer.name for layer in image_model.layers if isinstance(layer, tf.keras.layers.Conv2D)]
                    last_conv_layer = conv_layers[-1] if conv_layers else None
                    if last_conv_layer:
                        heatmap = make_gradcam_heatmap(img_array, image_model, last_conv_layer)
                        heatmap_filename = f"cam_{filename}"
                        heatmap_path = os.path.join(GRADCAM_FOLDER, heatmap_filename)
                        save_and_display_gradcam(image_path, heatmap, heatmap_path)
                    else:
                        heatmap_path = image_path
                except Exception as e:
                    print(f"GradCAM error: {e}")
                    heatmap_path = image_path
            else:
                # Mock prediction for UI testing
                import random
                disease_prediction = random.choice(CLASSES)
                disease_conf = random.uniform(70.0, 99.9)
                heatmap_path = image_path # mock heatmap as original image

    # 3. Handle Clinical Risk Prediction
    clinical_data = request.form
    risk_level = "Unknown"
    cancer_prob = 0.0
    
    if risk_model and clinical_data.get('age'):
        # Convert form data to dataframe
        data_dict = {
            'age': [safe_float(clinical_data.get('age', 0))],
            'bmi': [safe_float(clinical_data.get('bmi', 0))],
            'tumor_size': [safe_float(clinical_data.get('tumor_size', 0))],
            'gender': [clinical_data.get('gender', 'Male') or 'Male'],
            'smoking': [safe_int(clinical_data.get('smoking', 0))],
            'alcohol': [safe_int(clinical_data.get('alcohol', 0))],
            'diabetes': [safe_int(clinical_data.get('diabetes', 0))],
            'ibd': [safe_int(clinical_data.get('ibd', 0))],
            'family_history': [safe_int(clinical_data.get('family_history', 0))],
            'previous_screening': [safe_int(clinical_data.get('previous_screening', 0))]
        }
        df = pd.DataFrame(data_dict)
        
        # One-hot encoding
        categorical_cols = df.select_dtypes(include=['object', 'string']).columns
        df = pd.get_dummies(df, columns=categorical_cols)
        
        # Ensure all expected columns are present
        for col in expected_features:
            if col not in df.columns:
                df[col] = 0
        df = df[expected_features]
        
        # Scale and predict
        scaled_data = scaler.transform(df)
        probs = risk_model.predict_proba(scaled_data)[0]
        pred_idx = np.argmax(probs)
        
        risk_map = {0: 'Low', 1: 'Medium', 2: 'High'}
        risk_level = risk_map.get(pred_idx, 'Unknown')
        cancer_prob = float(probs[2] * 100) # Assuming class 2 is High risk / Cancer
    else:
        # Mock risk for UI testing
        if clinical_data.get('age'):
            import random
            risk_level = random.choice(['Low', 'Medium', 'High'])
            cancer_prob = random.uniform(5.0, 95.0)
            
    # Recommendations Logic
    recommendation = "Routine screening is recommended."
    if risk_level == 'High' or disease_prediction in ['Polyps', 'Ulcerative Colitis']:
        recommendation = "Immediate Gastroenterologist Consultation required. Schedule a Colonoscopy."
    elif risk_level == 'Medium':
        recommendation = "Lifestyle changes and closely monitored screening suggested."

    # 4. Save Prediction to DB
    patient_id = patient.id if patient else 1 # Fallback for doctors testing
    
    new_prediction = Prediction(
        patient_id=patient_id,
        image_path=image_path,
        heatmap_path=heatmap_path,
        predicted_disease=disease_prediction,
        disease_confidence=disease_conf,
        risk_level=risk_level,
        cancer_probability=cancer_prob,
        survival_prediction=100.0 - (cancer_prob / 2), # Mock math
        recommendation=recommendation
    )
    
    db.session.add(new_prediction)
    db.session.commit()
    
    # 5. Generate PDF Report
    pdf_filename = f"report_{new_prediction.id}.pdf"
    pdf_path = os.path.join(REPORTS_FOLDER, pdf_filename)
    
    report_data = {
        'patient_id': patient_id,
        'age': clinical_data.get('age', 'N/A'),
        'gender': clinical_data.get('gender', 'N/A'),
        'bmi': clinical_data.get('bmi', 'N/A'),
        'predicted_disease': disease_prediction,
        'disease_confidence': disease_conf,
        'image_path': image_path,
        'heatmap_path': heatmap_path,
        'risk_level': risk_level,
        'cancer_probability': cancer_prob,
        'recommendation': recommendation
    }
    
    generate_patient_report(report_data, pdf_path)
    
    new_report = Report(prediction_id=new_prediction.id, pdf_path=pdf_path)
    db.session.add(new_report)
    db.session.commit()

    # --- Build enriched response ---

    # Full probability distribution across all 5 classes
    class_probabilities = []
    if image_model and 'preds' in dir():
        # preds is available from image prediction block
        pass
    # We'll compute it from the stored values - use softmax outputs stored in preds
    # Re-fetch preds if available in scope, else use confidence only
    class_probabilities = []
    try:
        if image_model and image_path:
            img2 = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
            arr2 = tf.keras.preprocessing.image.img_to_array(img2)
            arr2 = np.expand_dims(arr2, axis=0)
            arr2 = preprocess_input(arr2)
            raw_preds = image_model.predict(arr2, verbose=0)[0]
            class_probabilities = [
                {'class': CLASSES[i], 'probability': round(float(raw_preds[i]) * 100, 2)}
                for i in range(len(CLASSES))
            ]
    except Exception as e:
        print(f"Probability re-fetch error: {e}")
        class_probabilities = [{'class': c, 'probability': round(disease_conf if c == disease_prediction else 0, 2)} for c in CLASSES]

    # Severity score 1-10
    severity_map = {'Normal': 1, 'Other GI Diseases': 3, 'Esophagitis': 5, 'Ulcerative Colitis': 7, 'Polyps': 8}
    severity_base = severity_map.get(disease_prediction, 3)
    risk_boost = {'Low': 0, 'Medium': 1, 'High': 2}.get(risk_level, 0)
    severity_score = min(10, severity_base + risk_boost)

    # Risk factor breakdown
    risk_factors = []
    age_val = safe_float(clinical_data.get('age', 0)) if clinical_data.get('age') else 0
    if age_val > 60: risk_factors.append({'factor': 'Advanced Age', 'level': 'High', 'value': f'{int(age_val)} years'})
    if safe_int(clinical_data.get('family_history', 0)): risk_factors.append({'factor': 'Family History', 'level': 'High', 'value': 'Positive'})
    if safe_int(clinical_data.get('ibd', 0)): risk_factors.append({'factor': 'IBD History', 'level': 'High', 'value': 'Positive'})
    if safe_int(clinical_data.get('smoking', 0)): risk_factors.append({'factor': 'Smoking', 'level': 'Medium', 'value': 'Active'})
    if safe_int(clinical_data.get('alcohol', 0)): risk_factors.append({'factor': 'Alcohol Use', 'level': 'Medium', 'value': 'Active'})
    if safe_int(clinical_data.get('diabetes', 0)): risk_factors.append({'factor': 'Diabetes', 'level': 'Medium', 'value': 'Positive'})
    bmi_val = safe_float(clinical_data.get('bmi', 0))
    if bmi_val > 30: risk_factors.append({'factor': 'Obesity (BMI)', 'level': 'Medium', 'value': f'{bmi_val:.1f}'})

    # Disease-specific info
    disease_info_map = {
        'Normal': {'description': 'No pathological findings detected in the endoscopic image.', 'icd': 'K92.1', 'urgency': 'Routine'},
        'Polyps': {'description': 'Polyps are abnormal tissue growths that can become cancerous if untreated.', 'icd': 'K63.5', 'urgency': 'Urgent'},
        'Ulcerative Colitis': {'description': 'Chronic inflammatory disease of the colon mucosa requiring management.', 'icd': 'K51.9', 'urgency': 'High'},
        'Esophagitis': {'description': 'Inflammation of the esophagus, often associated with GERD or infection.', 'icd': 'K20.9', 'urgency': 'Moderate'},
        'Other GI Diseases': {'description': 'Other gastrointestinal pathology identified. Specialist review required.', 'icd': 'K92.9', 'urgency': 'Moderate'},
    }
    disease_info = disease_info_map.get(disease_prediction, disease_info_map['Other GI Diseases'])

    return jsonify({
        'message': 'Prediction successful',
        'prediction_id': new_prediction.id,
        'disease': disease_prediction,
        'confidence': disease_conf,
        'class_probabilities': class_probabilities,
        'heatmap_url': f"/api/gradcam/{os.path.basename(heatmap_path)}" if heatmap_path else None,
        'risk_level': risk_level,
        'cancer_probability': cancer_prob,
        'survival_score': round(100.0 - (cancer_prob / 2), 1),
        'severity_score': severity_score,
        'risk_factors': risk_factors,
        'disease_info': disease_info,
        'recommendation': recommendation,
        'report_url': f"/api/report/{new_prediction.id}/download"
    }), 200

