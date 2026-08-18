from flask import Flask
from flask_cors import CORS
from database.models import db
from routes.auth_routes import auth_bp
from routes.predict_routes import predict_bp
from routes.report_routes import report_bp
import os

def create_app():
    app = Flask(__name__)
    
    # Configure CORS - allow all origins for development
    CORS(app)
    
    # Configuration
    base_dir = os.path.abspath(os.path.dirname(__name__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'database', 'colonai.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Ensure upload directories exist
    os.makedirs(os.path.join(base_dir, 'datasets'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'trained_models'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'gradcam'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'reports'), exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    
    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(report_bp)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
