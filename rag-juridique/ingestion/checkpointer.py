"""
Système de checkpointing pour l'ingestion de données
Permet de reprendre une extraction interrompue sans recommencer depuis zéro
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class Checkpointer:
    """
    Gère la sauvegarde et le chargement de l'état d'une ingestion
    
    Fonctionnalités :
    - Sauvegarde périodique de l'état (tous les N articles)
    - Reprise automatique en cas d'interruption
    - Statistiques de progression (articles traités, erreurs, durée)
    - Thread-safe (utilisation de fichiers JSON atomiques)
    
    Usage:
        >>> cp = Checkpointer("LEGITEXT000006070721")  # Code Civil
        >>> state = cp.load()
        >>> # ... traitement ...
        >>> cp.save(last_article_id="art123", processed_count=500)
    """
    
    def __init__(self, identifier: str):
        """
        Args:
            identifier: Identifiant unique du processus (ex: ID du code)
        """
        self.identifier = identifier
        self.checkpoint_path = settings.get_checkpoint_path(identifier)
        self.logger = logger.bind(checkpoint_id=identifier)
    
    def load(self) -> dict[str, Any]:
        """
        Charge l'état sauvegardé s'il existe
        
        Returns:
            Dictionnaire contenant l'état, ou état initial si pas de checkpoint
            
        Format de l'état :
            {
                "identifier": "LEGITEXT000006070721",
                "last_article_id": "art123",
                "processed_count": 500,
                "error_count": 2,
                "started_at": "2025-01-01T10:00:00",
                "last_updated": "2025-01-01T11:30:00",
                "completed": false,
                "metadata": {...}  # Données additionnelles
            }
        """
        if not self.checkpoint_path.exists():
            self.logger.info(f"Aucun checkpoint trouvé, démarrage d'une nouvelle ingestion")
            return self._create_initial_state()
        
        try:
            with open(self.checkpoint_path, "r", encoding="utf-8") as f:
                state = json.load(f)
            
            self.logger.success(
                f"✅ Checkpoint chargé : {state['processed_count']} articles déjà traités"
            )
            self.logger.info(f"   Reprise depuis l'article : {state.get('last_article_id', 'N/A')}")
            self.logger.info(f"   Dernière mise à jour : {state.get('last_updated', 'N/A')}")
            
            return state
        
        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"❌ Checkpoint corrompu : {e}")
            self.logger.warning("🔄 Création d'un nouveau checkpoint")
            return self._create_initial_state()
    
    def save(
        self,
        last_article_id: Optional[str] = None,
        processed_count: Optional[int] = None,
        error_count: Optional[int] = None,
        completed: bool = False,
        metadata: Optional[dict] = None,
    ) -> None:
        """
        Sauvegarde l'état actuel
        
        Args:
            last_article_id: ID du dernier article traité
            processed_count: Nombre total d'articles traités
            error_count: Nombre d'erreurs rencontrées
            completed: True si l'ingestion est terminée
            metadata: Données additionnelles à sauvegarder
        """
        # Charger l'état existant ou créer un nouveau
        state = self.load() if self.checkpoint_path.exists() else self._create_initial_state()
        
        # Mettre à jour les champs modifiés
        if last_article_id is not None:
            state["last_article_id"] = last_article_id
        
        if processed_count is not None:
            state["processed_count"] = processed_count
        
        if error_count is not None:
            state["error_count"] = error_count
        
        state["completed"] = completed
        state["last_updated"] = datetime.now().isoformat()
        
        if metadata:
            state["metadata"].update(metadata)
        
        # Sauvegarde atomique (écrire dans un fichier temporaire puis renommer)
        temp_path = self.checkpoint_path.with_suffix(".tmp")
        
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, ensure_ascii=False)
            
            # Renommage atomique (évite la corruption si interruption)
            temp_path.replace(self.checkpoint_path)
            
            self.logger.debug(
                f"💾 Checkpoint sauvegardé : {processed_count} articles | "
                f"Erreurs : {error_count} | Complété : {completed}"
            )
        
        except Exception as e:
            self.logger.error(f"❌ Erreur lors de la sauvegarde du checkpoint : {e}")
            if temp_path.exists():
                temp_path.unlink()
    
    def mark_completed(self) -> None:
        """Marque l'ingestion comme terminée"""
        self.save(completed=True)
        self.logger.success(f"✅ Ingestion marquée comme complétée : {self.identifier}")
    
    def reset(self) -> None:
        """Supprime le checkpoint (force un redémarrage complet)"""
        if self.checkpoint_path.exists():
            self.checkpoint_path.unlink()
            self.logger.warning(f"🔄 Checkpoint supprimé : {self.identifier}")
    
    def get_progress_stats(self) -> dict[str, Any]:
        """
        Retourne des statistiques de progression
        
        Returns:
            {
                "processed_count": 1500,
                "error_count": 5,
                "error_rate": 0.33,
                "duration_seconds": 3600,
                "completed": false
            }
        """
        state = self.load()
        
        started_at = datetime.fromisoformat(state["started_at"])
        duration = (datetime.now() - started_at).total_seconds()
        
        processed = state["processed_count"]
        errors = state["error_count"]
        error_rate = (errors / processed * 100) if processed > 0 else 0.0
        
        return {
            "processed_count": processed,
            "error_count": errors,
            "error_rate": round(error_rate, 2),
            "duration_seconds": int(duration),
            "completed": state["completed"],
            "last_article_id": state.get("last_article_id"),
        }
    
    def _create_initial_state(self) -> dict[str, Any]:
        """Crée un état initial vide"""
        return {
            "identifier": self.identifier,
            "last_article_id": None,
            "processed_count": 0,
            "error_count": 0,
            "started_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "completed": False,
            "metadata": {},
        }

