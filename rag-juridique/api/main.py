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

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from api.routes import (
    audit,
    chatbot,
    downloads,
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
    logger.info(f"📊 GCP Project : {settings.GCP_PROJECT_ID}")
    logger.info(f"🤖 Gemini Model : {settings.GEMINI_PRO_MODEL}")
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Route racine
@app.get("/", tags=["Root"])
async def root():
    """
    Point d'entrée racine de l'API
    
    Returns:
        Message de bienvenue et liens utiles
    """
    return {
        "message": "🎯 LEGAL-RAG FRANCE API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "pillars": {
            "pillar_1": "/api/v1/machine-actes",
            "pillar_2": "/api/v1/search",
            "pillar_3": "/api/v1/audit",
            "pillar_4": "/api/v1/synthese",
            "pillar_5": "/api/v1/chat",
        },
        "resources": {
            "templates": "/api/v1/templates",
            "downloads": "/api/v1/download",
        }
    }


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
        "gemini": "configured" if settings.GEMINI_API_KEY else "not_configured",
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

