"""
API REST FastAPI - LEGAL-RAG FRANCE

Point d'entrée principal de l'API exposant les 5 piliers :
- Pilier 1 : Machine à Actes
- Pilier 2 : Super-Chercheur
- Pilier 3 : Audit et Conformité
- Pilier 4 : Synthèse et Stratégie
- Pilier 5 : Chatbot Avocat

Documentation : http://localhost:8000/docs
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from loguru import logger

# Frontend config — read from env vars at runtime (set in Cloud Run service config)
# Supports both _VITE_* (Cloud Build substitution style) and VITE_* names
_SUPABASE_URL = os.environ.get('_VITE_SUPABASE_URL') or os.environ.get('VITE_SUPABASE_URL', '')
_SUPABASE_ANON_KEY = os.environ.get('_VITE_SUPABASE_ANON_KEY') or os.environ.get('VITE_SUPABASE_ANON_KEY', '')
_STREAM_API_KEY = os.environ.get('_VITE_STREAM_API_KEY') or os.environ.get('VITE_STREAM_API_KEY', '')
_STREAM_APP_ID = os.environ.get('_VITE_STREAM_APP_ID') or os.environ.get('VITE_STREAM_APP_ID', '')

from api.routes import (
    audit,
    chatbot,
    daily_proxy,
    downloads,
    gemini_proxy,
    machine_actes,
    super_chercheur,
    synthese,
    templates,
)
from config.logging_config import setup_logging
from config.settings import get_settings

# Configuration
setup_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestion du cycle de vie de l'application
    
    Startup : Initialisation des ressources
    Shutdown : Nettoyage
    """
    # Startup
    logger.info("="*70)
    logger.info("🚀 DÉMARRAGE DE L'API LEGAL-RAG FRANCE")
    logger.info("="*70)
    logger.info(f"📍 Environnement : {settings.LOG_LEVEL}")
    logger.info(f"📊 GCP Project : {settings.GCP_PROJECT_ID or '(not set)'}")
    logger.info(f"🤖 Gemini Model : {settings.GEMINI_PRO_MODEL}")
    if settings.GCP_PROJECT_ID:
        import vertexai
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
        logger.success("✅ Vertex AI initialisé")
    else:
        logger.warning("⚠️ GCP_PROJECT_ID non configuré — Vertex AI désactivé")
    logger.success("✅ API prête à recevoir des requêtes")
    logger.info("="*70)
    
    yield
    
    # Shutdown
    logger.info("🛑 Arrêt de l'API...")
    logger.success("✅ API arrêtée proprement")


# Création de l'application FastAPI
app = FastAPI(
    title="LEGAL-RAG FRANCE API",
    description="""
    ## 🎯 API REST pour la plateforme d'ingénierie juridique

    Cette API expose 5 piliers d'intelligence artificielle juridique :

    ### 📝 Pilier 1 : Machine à Actes
    Génération automatique d'actes juridiques par mimétisme intelligent.

    ### 🔍 Pilier 2 : Super-Chercheur de Jurisprudence
    Recherche sémantique avancée avec analyse de tendances et probabilités.

    ### ⚖️ Pilier 3 : Audit et Conformité
    Détection d'anachronismes et vérification de conformité réglementaire.

    ### 📊 Pilier 4 : Synthèse et Aide à la Stratégie
    Synthèse intelligente de dossiers procéduraux en notes stratégiques.

    ### 💬 Pilier 5 : Chatbot Avocat
    Assistant conversationnel intelligent avec RAG et grounding.

    ---

    **Version** : 1.0.0  
    **Licence** : Propriétaire  
    **Contact** : support@legal-rag-france.fr
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configuration CORS
# In production the React build is served by FastAPI itself (same origin),
# so CORS is only needed for the local Vite dev server.
_allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.FRONTEND_URL:
    _allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Vérification de l'état de santé de l'API
    
    Returns:
        État de santé des différents composants
    """
    return {
        "status": "healthy",
        "api": "operational",
        "gemini": "vertex_ai_adc" if settings.GCP_PROJECT_ID else "not_configured",
        "vertex_ai": "configured" if settings.GCP_PROJECT_ID else "not_configured",
    }


# Inclusion des routes
app.include_router(
    machine_actes.router,
    prefix="/api/v1/machine-actes",
    tags=["Pilier 1 : Machine à Actes"]
)

app.include_router(
    super_chercheur.router,
    prefix="/api/v1/search",
    tags=["Pilier 2 : Super-Chercheur"]
)

app.include_router(
    audit.router,
    prefix="/api/v1/audit",
    tags=["Pilier 3 : Audit et Conformité"]
)

app.include_router(
    synthese.router,
    prefix="/api/v1/synthese",
    tags=["Pilier 4 : Synthèse et Stratégie"]
)

app.include_router(
    chatbot.router,
    prefix="/api/v1/chat",
    tags=["Pilier 5 : Chatbot Avocat"]
)

app.include_router(
    templates.router,
    prefix="/api/v1/templates",
    tags=["Templates PDF"]
)

app.include_router(
    downloads.router,
    prefix="/api/v1/download",
    tags=["Téléchargements"]
)

app.include_router(
    gemini_proxy.router,
    prefix="/api/v1/gemini",
    tags=["Gemini Proxy (frontend)"]
)

app.include_router(
    daily_proxy.router,
    prefix="/api/v1/daily",
    tags=["Daily.co Proxy (frontend)"]
)


# Serve React static build — catch-all injects runtime config into index.html
_static_dir = Path(__file__).parent.parent / "static"

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    if not _static_dir.exists():
        return JSONResponse({"error": "static dir not found"}, status_code=404)
    # Serve static assets (JS, CSS, images, fonts) directly
    static_file = _static_dir / full_path
    if static_file.exists() and static_file.is_file():
        return FileResponse(str(static_file))
    # For all SPA routes, serve index.html with runtime config injected
    index_path = _static_dir / "index.html"
    if not index_path.exists():
        return JSONResponse({"error": "index.html not found"}, status_code=404)
    content = index_path.read_text()
    config_script = (
        f'<script>window.__JURILAB_CONFIG__='
        f'{{supabaseUrl:"{_SUPABASE_URL}",'
        f'supabaseAnonKey:"{_SUPABASE_ANON_KEY}",'
        f'streamApiKey:"{_STREAM_API_KEY}",'
        f'streamAppId:"{_STREAM_APP_ID}"}}</script>'
    )
    content = content.replace("</head>", config_script + "</head>", 1)
    return HTMLResponse(content=content)


# Gestionnaire d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Gestionnaire d'erreurs global"""
    logger.error(f"❌ Erreur non gérée : {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "type": type(exc).__name__,
        }
    )


# Point d'entrée pour uvicorn
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

