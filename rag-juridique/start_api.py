"""
Script de démarrage de l'API REST LEGAL-RAG FRANCE

Usage:
    python start_api.py

L'API sera accessible sur http://localhost:8000
Documentation Swagger : http://localhost:8000/docs
"""

import uvicorn
from loguru import logger

if __name__ == "__main__":
    logger.info("="*70)
    logger.info("🚀 DÉMARRAGE DE L'API LEGAL-RAG FRANCE")
    logger.info("="*70)
    logger.info("")
    logger.info("📍 URL: http://localhost:8000")
    logger.info("📚 Documentation: http://localhost:8000/docs")
    logger.info("📖 ReDoc: http://localhost:8000/redoc")
    logger.info("")
    logger.info("💡 Appuyez sur CTRL+C pour arrêter")
    logger.info("="*70)
    logger.info("")
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

