FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 TF_CPP_MIN_LOG_LEVEL=2
WORKDIR /app
COPY backend/requirements.txt /tmp/requirements.txt
RUN sed -i 's/^tensorflow==/tensorflow-cpu==/;s/^opencv-python==/opencv-python-headless==/' /tmp/requirements.txt     && pip install --no-cache-dir -r /tmp/requirements.txt gunicorn==23.0.0
COPY backend/app.py backend/gunicorn.conf.py ./backend/
COPY backend/database/models.py ./backend/database/models.py
COPY backend/routes/auth_routes.py backend/routes/study_routes.py ./backend/routes/
COPY backend/utils/ ./backend/utils/
COPY backend/trained_models/kvasir_public/ ./backend/trained_models/kvasir_public/
COPY --from=frontend /build/frontend/dist/ ./frontend/dist/
EXPOSE 8080
CMD ["gunicorn", "--chdir", "backend", "--config", "gunicorn.conf.py", "app:create_app()"]
