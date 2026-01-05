"""
Routes de l'API REST

Ce package contient tous les endpoints de l'API organisés par fonctionnalité.
"""

from api.routes import (
    audit,
    chatbot,
    downloads,
    machine_actes,
    super_chercheur,
    synthese,
    templates,
)

__all__ = [
    "machine_actes",
    "super_chercheur",
    "audit",
    "synthese",
    "chatbot",
    "templates",
    "downloads",
]

