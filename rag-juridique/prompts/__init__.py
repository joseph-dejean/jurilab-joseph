"""
Module de gestion centralisée des prompts

Tous les prompts système sont définis ici pour faciliter :
- La modification rapide
- La traduction
- Le versioning
- L'A/B testing
"""

from prompts.prompts import *

__all__ = [
    # Pilier 2 - Super-Chercheur
    "PROMPT_SEARCH_SUMMARY",
    
    # Pilier 3 - Audit et Conformité
    "PROMPT_AUDIT_RECOMMENDATIONS",
    
    # Pilier 4 - Synthèse et Stratégie
    "PROMPT_STRATEGIC_NOTE",
    "PROMPT_TREND_ANALYSIS",
    "PROMPT_CLIENT_REPORT",
    "PROMPT_CASE_SUMMARY",
    
    # Pilier 5 - Chatbot Avocat
    "PROMPT_CHATBOT_SYSTEM",
    "PROMPT_CHATBOT_WITH_SOURCES",
]

