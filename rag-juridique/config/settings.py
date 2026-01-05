"""
Configuration centralisée pour Legal-RAG France
Gère tous les paramètres via variables d'environnement avec Pydantic
"""

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration globale de l'application Legal-RAG"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # ==============================================================================
    # CHEMINS DE BASE
    # ==============================================================================
    BASE_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent)
    DATA_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data")
    RAW_DATA_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "raw")
    PROCESSED_DATA_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "processed")
    CHECKPOINT_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "checkpoints")
    EXPORT_DIR: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "data" / "exports")
    
    # ==============================================================================
    # API LÉGIFRANCE (PISTE)
    # ==============================================================================
    PISTE_CLIENT_ID: str = Field(default="")
    PISTE_CLIENT_SECRET: str = Field(default="")
    PISTE_GRANT_TYPE: str = Field(default="client_credentials")
    PISTE_TOKEN_URL: str = Field(default="https://oauth.piste.gouv.fr/api/oauth/token")
    
    # ==============================================================================
    # GOOGLE CLOUD PLATFORM
    # ==============================================================================
    GCP_PROJECT_ID: str = Field(default="")
    GCP_REGION: str = Field(default="europe-west1")
    GCP_LOCATION: str = Field(default="global", description="Location du data store (global ou regional)")
    GCP_DATASTORE_ID: str = Field(default="legal-rag-datastore")
    GCP_SEARCH_APP_ID: str = Field(default="", description="ID de la Search App Vertex AI")
    GOOGLE_APPLICATION_CREDENTIALS: str = Field(default="")
    
    # ==============================================================================
    # HUGGING FACE
    # ==============================================================================
    HF_TOKEN: str = Field(default="")
    HF_DATASET_NAME: str = Field(default="antoinejeannot/decisions-justice")
    
    # ==============================================================================
    # MODÈLES GEMINI
    # ==============================================================================
    GEMINI_API_KEY: str = Field(default="", description="Clé API Gemini (Google AI Studio)")
    GEMINI_PRO_MODEL: str = Field(default="models/gemini-pro-latest")
    GEMINI_FLASH_MODEL: str = Field(default="models/gemini-flash-latest")
    
    # ==============================================================================
    # MCP (MODEL CONTEXT PROTOCOL)
    # ==============================================================================
    MCP_SERVER_URL: str = Field(default="http://localhost:3000")
    MCP_ENABLE: bool = Field(default=False)
    
    # ==============================================================================
    # PARAMÈTRES D'INGESTION
    # ==============================================================================
    CHECKPOINT_INTERVAL: int = Field(default=500, description="Sauvegarde tous les X articles")
    MAX_RETRY_ATTEMPTS: int = Field(default=3, description="Nombre de tentatives en cas d'erreur")
    RATE_LIMIT_DELAY: float = Field(default=0.5, description="Délai entre requêtes API (secondes)")
    
    # ==============================================================================
    # LOGS
    # ==============================================================================
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(default="INFO")
    LOG_FILE: str = Field(default="logs/legal_rag.log")
    
    # ==============================================================================
    # CODES JURIDIQUES À INGÉRER
    # ==============================================================================
    CODES_TO_INGEST: list[str] = Field(
        default=[
            "LEGITEXT000006070721",  # Code Civil
            "LEGITEXT000006070719",  # Code Pénal
            "LEGITEXT000006072050",  # Code du Travail
            "LEGITEXT000006074082",  # Code de Commerce
            "LEGITEXT000006073189",  # Code de Procédure Civile
        ],
        description="Liste des identifiants Légifrance des codes à ingérer"
    )
    
    @field_validator("RAW_DATA_DIR", "PROCESSED_DATA_DIR", "CHECKPOINT_DIR", "EXPORT_DIR", mode="after")
    @classmethod
    def create_directories(cls, path: Path) -> Path:
        """Crée automatiquement les dossiers s'ils n'existent pas"""
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_checkpoint_path(self, code_id: str) -> Path:
        """Retourne le chemin du fichier checkpoint pour un code donné"""
        return self.CHECKPOINT_DIR / f"checkpoint_{code_id}.json"
    
    def get_raw_export_path(self, code_id: str) -> Path:
        """Retourne le chemin du fichier brut pour un code donné"""
        return self.RAW_DATA_DIR / f"{code_id}_raw.json"
    
    def get_jsonl_export_path(self, code_id: str) -> Path:
        """Retourne le chemin du fichier JSONL pour Vertex AI"""
        return self.EXPORT_DIR / f"{code_id}_vertex.jsonl"


# Instance globale de configuration (singleton)
settings = Settings()


# Fonction helper pour accès rapide
def get_settings() -> Settings:
    """Retourne l'instance globale des paramètres"""
    return settings

