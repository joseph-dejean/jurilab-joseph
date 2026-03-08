# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the React / Vite frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time env vars injected by Cloud Build
# NOTE: VITE_GEMINI_API_KEY intentionally removed — Gemini calls go through the FastAPI backend (ADC).
# NOTE: VITE_DAILY_API_KEY intentionally removed — Daily.co calls go through the FastAPI backend.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_DEVELOPER_KEY
ARG VITE_GOOGLE_APP_ID
ARG VITE_STREAM_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_DEVELOPER_KEY=$VITE_GOOGLE_DEVELOPER_KEY
ENV VITE_GOOGLE_APP_ID=$VITE_GOOGLE_APP_ID
ENV VITE_STREAM_API_KEY=$VITE_STREAM_API_KEY

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Python FastAPI backend serving both API and React static files
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim

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
