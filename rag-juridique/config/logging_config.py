"""
Configuration du système de logging avec Loguru
Centralise tous les logs de l'application Legal-RAG
"""

import sys
from pathlib import Path

from loguru import logger

from config.settings import get_settings


def setup_logging() -> None:
    """
    Configure Loguru pour l'ensemble de l'application
    
    Fonctionnalités :
    - Logs dans la console avec couleurs
    - Logs dans un fichier avec rotation automatique
    - Format enrichi avec contexte (fichier, fonction, ligne)
    - Niveaux de log configurables via .env
    """
    settings = get_settings()
    
    # Supprimer le handler par défaut de Loguru
    logger.remove()
    
    # ==============================================================================
    # HANDLER 1 : CONSOLE (avec couleurs et format simplifié)
    # ==============================================================================
    logger.add(
        sink=sys.stderr,
        level=settings.LOG_LEVEL,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
        backtrace=True,  # Affiche la trace complète en cas d'erreur
        diagnose=True,   # Affiche les variables locales en cas d'erreur
    )
    
    # ==============================================================================
    # HANDLER 2 : FICHIER (avec rotation et rétention)
    # ==============================================================================
    log_file_path = Path(settings.LOG_FILE)
    log_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.add(
        sink=log_file_path,
        level="DEBUG",  # Toujours en DEBUG dans le fichier (utile pour débogage)
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
            "{level: <8} | "
            "{name}:{function}:{line} | "
            "{message}"
        ),
        rotation="50 MB",      # Crée un nouveau fichier tous les 50 MB
        retention="10 days",   # Conserve les logs pendant 10 jours
        compression="zip",     # Compresse les anciens logs
        enqueue=True,          # Thread-safe (utile pour l'async)
        backtrace=True,
        diagnose=True,
    )
    
    logger.info("✅ Système de logging initialisé")
    logger.debug(f"Niveau de log console : {settings.LOG_LEVEL}")
    logger.debug(f"Fichier de log : {log_file_path.absolute()}")


def get_logger(name: str):
    """
    Retourne un logger contextualisé pour un module
    
    Args:
        name: Nom du module (utilisez __name__)
    
    Returns:
        Logger Loguru bindé au contexte
    
    Usage:
        >>> from config.logging_config import get_logger
        >>> logger = get_logger(__name__)
        >>> logger.info("Mon message")
    """
    return logger.bind(module=name)


# Configuration automatique au premier import
setup_logging()

