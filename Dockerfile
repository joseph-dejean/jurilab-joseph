# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the React / Vite frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env vars injected by Cloud Build
# NOTE: VITE_GEMINI_API_KEY is intentionally removed — Gemini calls go through
#       the FastAPI backend which uses ADC (no key in the browser bundle).
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_DATABASE_URL
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_DEVELOPER_KEY
ARG VITE_GOOGLE_APP_ID
ARG VITE_DAILY_API_KEY
ARG VITE_STREAM_API_KEY

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_DATABASE_URL=$VITE_FIREBASE_DATABASE_URL
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_DEVELOPER_KEY=$VITE_GOOGLE_DEVELOPER_KEY
ENV VITE_GOOGLE_APP_ID=$VITE_GOOGLE_APP_ID
ENV VITE_DAILY_API_KEY=$VITE_DAILY_API_KEY
ENV VITE_STREAM_API_KEY=$VITE_STREAM_API_KEY

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Python FastAPI backend serving both API and React static files
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY rag-juridique/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application
COPY rag-juridique/ ./

# Copy React build output → served at "/" by FastAPI StaticFiles
COPY --from=frontend-builder /app/dist ./static

# Cloud Run listens on port 8080
EXPOSE 8080

# ADC is provided automatically by the Cloud Run service account
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
