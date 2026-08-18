from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'doctor' or 'patient'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Optional assignment
    
    # Clinical Data
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    bmi = db.Column(db.Float)
    smoking = db.Column(db.Boolean, default=False)
    alcohol = db.Column(db.Boolean, default=False)
    diabetes = db.Column(db.Boolean, default=False)
    ibd = db.Column(db.Boolean, default=False)
    family_history = db.Column(db.Boolean, default=False)
    tumor_size = db.Column(db.Float)
    cancer_stage = db.Column(db.String(20))
    previous_screening = db.Column(db.Boolean, default=False)

    user = db.relationship('User', foreign_keys=[user_id])
    doctor = db.relationship('User', foreign_keys=[doctor_id])
    predictions = db.relationship('Prediction', backref='patient', lazy=True)

class Prediction(db.Model):
    __tablename__ = 'predictions'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    
    # Image Analysis (EfficientNet)
    image_path = db.Column(db.String(255))
    heatmap_path = db.Column(db.String(255))
    predicted_disease = db.Column(db.String(100))
    disease_confidence = db.Column(db.Float)
    
    # Clinical Risk (XGBoost)
    risk_level = db.Column(db.String(20)) # Low, Medium, High
    cancer_probability = db.Column(db.Float)
    survival_prediction = db.Column(db.Float)
    
    recommendation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey('predictions.id'), nullable=False)
    pdf_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    prediction = db.relationship('Prediction', backref=db.backref('report', uselist=False))
