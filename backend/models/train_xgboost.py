import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib
import os
import matplotlib.pyplot as plt

DATASET_PATH = '../datasets/clinical_data.csv'
MODEL_SAVE_PATH = '../trained_models/xgboost_risk_model.pkl'
SCALER_SAVE_PATH = '../trained_models/scaler.pkl'

def create_dummy_data_if_needed():
    """Create a dummy dataset if the real one isn't present for testing purposes."""
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset {DATASET_PATH} not found. Creating a synthetic dataset for training.")
        os.makedirs(os.path.dirname(DATASET_PATH), exist_ok=True)
        import numpy as np
        
        # Generating synthetic data
        np.random.seed(42)
        n = 1000
        data = {
            'age': np.random.randint(20, 90, n),
            'bmi': np.random.uniform(18.5, 40.0, n),
            'tumor_size': np.random.uniform(0.0, 10.0, n),
            'gender': np.random.choice(['Male', 'Female'], n),
            'smoking': np.random.choice([0, 1], n),
            'alcohol': np.random.choice([0, 1], n),
            'diabetes': np.random.choice([0, 1], n),
            'ibd': np.random.choice([0, 1], n),
            'family_history': np.random.choice([0, 1], n),
            'previous_screening': np.random.choice([0, 1], n),
            'risk_level': np.random.choice([0, 1, 2], n) # 0: Low, 1: Medium, 2: High
        }
        
        # Add some correlation so the model learns something
        data['risk_level'] = (data['age'] > 60).astype(int) + (data['family_history']) + (data['ibd'])
        data['risk_level'] = np.clip(data['risk_level'], 0, 2)
        
        df = pd.DataFrame(data)
        df.to_csv(DATASET_PATH, index=False)
        print("Synthetic dataset created.")

def train():
    create_dummy_data_if_needed()
    
    df = pd.read_csv(DATASET_PATH)
    
    # Preprocessing
    # Assuming 'risk_level' is the target. 0: Low, 1: Medium, 2: High
    y = df['risk_level']
    
    # Drop target
    X = df.drop('risk_level', axis=1)
    
    # Feature Encoding (One-Hot for categorical)
    categorical_cols = X.select_dtypes(include=['object', 'string']).columns
    X = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
    
    # Save the expected columns for inference time
    expected_cols = list(X.columns)
    joblib.dump(expected_cols, '../trained_models/expected_features.pkl')
    
    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train XGBoost
    model = xgb.XGBClassifier(
        objective='multi:softprob', 
        num_class=3, 
        eval_metric='mlogloss',
        use_label_encoder=False
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Feature Importance Plot
    xgb.plot_importance(model)
    plt.title("XGBoost Feature Importance")
    plt.tight_layout()
    os.makedirs('../reports', exist_ok=True)
    plt.savefig('../reports/feature_importance.png')
    plt.close()
    
    # Save Models
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(model, MODEL_SAVE_PATH)
    joblib.dump(scaler, SCALER_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    train()
