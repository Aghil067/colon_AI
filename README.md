# ColonAI — Intestinal Disorder Detection & Cancer Risk Prediction

A final-year project implementing a **dual AI pipeline** for GI disorder classification and colorectal cancer risk prediction.

## 🧠 AI Models

| Model | Task | Accuracy |
|---|---|---|
| **MobileNetV2** (Transfer Learning) | Endoscopic image classification → 5 GI categories | ~64%+ |
| **XGBoost** | Clinical risk stratification (cancer probability) | 99.5% |
| **Grad-CAM** | Visual explainability heatmaps | — |

## 🗂️ Disease Classes
- Normal
- Polyps
- Ulcerative Colitis
- Esophagitis
- Other GI Diseases

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Flask (Python) |
| Image AI | TensorFlow / Keras — MobileNetV2 |
| Risk AI | XGBoost |
| Database | SQLite (SQLAlchemy ORM) |
| PDF Reports | ReportLab |
| Explainability | Grad-CAM |

## 🚀 Setup

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Train models (run once)
python models/augment_data.py
python models/train_efficientnet.py
python models/train_xgboost.py

# Start server
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure
```
intestinal-disorder/
├── backend/
│   ├── app.py                 # Flask entry point
│   ├── routes/                # API routes
│   ├── models/                # Training scripts
│   ├── database/              # SQLAlchemy models
│   ├── utils/                 # PDF, GradCAM, security
│   ├── datasets/              # Original dataset images
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/             # React pages
    │   ├── components/        # Navbar, Sidebar
    │   └── context/           # Auth context
    └── package.json
```

## ⚠️ Disclaimer
This system is for academic and research purposes only. Not a substitute for professional medical advice.
