#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-time GCP setup for Jurilab Cloud Run deployment
# Run this ONCE from your local machine (not in CI) with:
#   chmod +x scripts/setup-gcp.sh && ./scripts/setup-gcp.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated: gcloud auth login
#   - PROJECT_ID set correctly below
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="jurilab-8bc6d"           # GCP project ID
REGION="europe-west1"
SERVICE_NAME="jurilab-app"
REPO_NAME="jurilab"

echo "=== Setting project ==="
gcloud config set project "$PROJECT_ID"

echo "=== Enabling required APIs ==="
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  discoveryengine.googleapis.com

echo "=== Creating Artifact Registry repository (if not exists) ==="
gcloud artifacts repositories create "$REPO_NAME" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Jurilab Docker images" \
  2>/dev/null || echo "Repository already exists, skipping."

echo "=== Creating Secret Manager secrets ==="
echo "You will be prompted to enter each secret value."

create_secret() {
  local SECRET_NAME=$1
  local PROMPT=$2
  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "Secret $SECRET_NAME already exists. Updating version..."
    printf '%s' "$(read -rsp "$PROMPT: " val && echo "$val")" \
      | gcloud secrets versions add "$SECRET_NAME" --data-file=-
  else
    printf '%s' "$(read -rsp "$PROMPT: " val && echo "$val")" \
      | gcloud secrets create "$SECRET_NAME" --data-file=- --replication-policy=automatic
  fi
  echo ""
}

create_secret "jurilab-daily-api-key"       "Daily.co API key"
create_secret "jurilab-piste-client-id"     "PISTE client ID"
create_secret "jurilab-piste-client-secret" "PISTE client secret"

echo "=== Getting Cloud Run service account ==="
# Cloud Run uses the Compute Engine default SA unless a custom one is set.
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Cloud Run SA: $CLOUD_RUN_SA"

echo "=== Granting IAM roles to Cloud Run service account ==="
for ROLE in \
  "roles/aiplatform.user" \
  "roles/discoveryengine.viewer" \
  "roles/secretmanager.secretAccessor"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="$ROLE" \
    --condition=None \
    --quiet
  echo "  Granted $ROLE"
done

echo "=== Granting Cloud Build SA permission to deploy Cloud Run ==="
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
for ROLE in \
  "roles/run.admin" \
  "roles/iam.serviceAccountUser" \
  "roles/secretmanager.secretAccessor"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="$ROLE" \
    --condition=None \
    --quiet
  echo "  Granted $ROLE to Cloud Build SA"
done

echo ""
echo "=== DONE ==="
echo ""
echo "Next steps:"
echo "  1. Create a Cloud Build trigger pointing to your GitHub repo, branch: claude/test-app-connection-m8J1j"
echo "     Set substitution variables (_VITE_FIREBASE_API_KEY etc.) in the trigger config."
echo "  2. Push a commit or trigger manually to deploy."
echo "  3. After first deploy, get the Cloud Run URL and set FRONTEND_URL in Secret Manager"
echo "     or update the Cloud Run service env vars if needed for CORS."
echo ""
echo "  Check deployment:"
echo "    gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'"
