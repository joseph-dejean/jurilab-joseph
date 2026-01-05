"""
Modèles Pydantic pour les requêtes et réponses de l'API LEGAL-RAG
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# ENUMS
# ============================================================================

class Jurisdiction(str, Enum):
    """Juridictions disponibles"""
    COUR_CASSATION = "Cour de cassation"
    CONSEIL_ETAT = "Conseil d'État"
    COUR_APPEL = "Cour d'appel"
    TRIBUNAL_JUDICIAIRE = "Tribunal judiciaire"
    TRIBUNAL_ADMINISTRATIF = "Tribunal administratif"
    TOUTES = "Toutes"


class LegalMatter(str, Enum):
    """Matières juridiques"""
    CIVIL = "Droit civil"
    PENAL = "Droit pénal"
    TRAVAIL = "Droit du travail"
    COMMERCIAL = "Droit commercial"
    ADMINISTRATIF = "Droit administratif"
    CONSTITUTIONNEL = "Droit constitutionnel"
    TOUTES = "Toutes"


class DocumentStatus(str, Enum):
    """État d'un document juridique"""
    VIGUEUR = "VIGUEUR"
    ABROGE = "ABROGE"
    MODIFIE = "MODIFIE"


# ============================================================================
# SUPER-CHERCHEUR - MODÈLES
# ============================================================================

class SearchFilters(BaseModel):
    """Filtres de recherche avancés"""
    
    code_id: Optional[str] = Field(
        None,
        description="ID du code juridique (ex: LEGITEXT000006070721)"
    )
    jurisdiction: Optional[Jurisdiction] = Field(
        Jurisdiction.TOUTES,
        description="Juridiction ciblée"
    )
    matter: Optional[LegalMatter] = Field(
        LegalMatter.TOUTES,
        description="Matière juridique"
    )
    etat: Optional[DocumentStatus] = Field(
        None,
        description="État du document"
    )
    date_min: Optional[str] = Field(
        None,
        description="Date minimum (format: YYYY-MM-DD)"
    )
    date_max: Optional[str] = Field(
        None,
        description="Date maximum (format: YYYY-MM-DD)"
    )
    article_num_min: Optional[int] = Field(
        None,
        description="Numéro d'article minimum"
    )
    article_num_max: Optional[int] = Field(
        None,
        description="Numéro d'article maximum"
    )


class SearchRequest(BaseModel):
    """Requête de recherche"""
    
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Question ou requête en langage naturel"
    )
    filters: SearchFilters = Field(
        default_factory=SearchFilters,
        description="Filtres de recherche optionnels"
    )
    page_size: int = Field(
        10,
        ge=1,
        le=100,
        description="Nombre de résultats à retourner"
    )
    analyze_trends: bool = Field(
        True,
        description="Activer l'analyse de tendances"
    )
    include_metadata: bool = Field(
        True,
        description="Inclure les métadonnées détaillées"
    )


class SearchResult(BaseModel):
    """Un résultat de recherche"""
    
    id: str = Field(..., description="Identifiant unique du document")
    title: str = Field(..., description="Titre du document")
    content: str = Field(..., description="Contenu textuel")
    score: float = Field(..., description="Score de pertinence (0-1)")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Métadonnées du document"
    )
    highlights: Optional[list[str]] = Field(
        None,
        description="Extraits mis en évidence"
    )


class TrendAnalysis(BaseModel):
    """Analyse de tendances jurisprudentielles"""
    
    success_probability: Optional[float] = Field(
        None,
        ge=0,
        le=1,
        description="Probabilité de succès estimée"
    )
    similar_cases_count: int = Field(
        0,
        description="Nombre de cas similaires trouvés"
    )
    dominant_jurisprudence: Optional[str] = Field(
        None,
        description="Jurisprudence dominante identifiée"
    )
    key_arguments: list[str] = Field(
        default_factory=list,
        description="Arguments clés récurrents"
    )
    temporal_evolution: Optional[dict[str, Any]] = Field(
        None,
        description="Évolution temporelle de la jurisprudence"
    )


class SearchResponse(BaseModel):
    """Réponse de recherche complète"""
    
    results: list[SearchResult] = Field(
        default_factory=list,
        description="Liste des résultats trouvés"
    )
    total: int = Field(
        0,
        description="Nombre total de résultats"
    )
    query: str = Field(..., description="Requête d'origine")
    filters_applied: dict[str, Any] = Field(
        default_factory=dict,
        description="Filtres appliqués"
    )
    trends: Optional[TrendAnalysis] = Field(
        None,
        description="Analyse de tendances"
    )
    processing_time_ms: float = Field(
        0,
        description="Temps de traitement en millisecondes"
    )


# ============================================================================
# CHATBOT - MODÈLES
# ============================================================================

class ChatMessage(BaseModel):
    """Un message dans une conversation"""
    
    role: str = Field(..., description="Rôle (user ou assistant)")
    content: str = Field(..., description="Contenu du message")
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Horodatage"
    )


class Source(BaseModel):
    """Une source citée par le chatbot"""
    
    type: str = Field(..., description="Type de source (code, jurisprudence, etc.)")
    reference: str = Field(..., description="Référence complète")
    text: str = Field(..., description="Extrait pertinent")
    relevance: float = Field(0, description="Score de pertinence")


class ChatRequest(BaseModel):
    """Requête de chat"""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Message de l'utilisateur"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="ID de la conversation (pour contexte)"
    )
    use_rag: bool = Field(
        True,
        description="Utiliser le RAG pour grounding"
    )
    max_sources: int = Field(
        5,
        ge=0,
        le=10,
        description="Nombre maximum de sources à citer"
    )


class ChatResponse(BaseModel):
    """Réponse du chatbot"""
    
    response: str = Field(..., description="Réponse générée")
    sources: list[Source] = Field(
        default_factory=list,
        description="Sources utilisées"
    )
    conversation_id: str = Field(..., description="ID de la conversation")
    suggested_actions: list[str] = Field(
        default_factory=list,
        description="Actions suggérées"
    )
    confidence: float = Field(
        0,
        ge=0,
        le=1,
        description="Niveau de confiance de la réponse"
    )


# ============================================================================
# MACHINE À ACTES - MODÈLES
# ============================================================================

class ActType(str, Enum):
    """Types d'actes juridiques disponibles"""
    CONTRACT_SALE = "contract_sale"                # Contrat de vente
    CONTRACT_WORK = "contract_work"                # Contrat de travail
    CONTRACT_SERVICE = "contract_service"          # Contrat de prestation
    LEASE_COMMERCIAL = "lease_commercial"          # Bail commercial
    LEASE_RESIDENTIAL = "lease_residential"        # Bail d'habitation
    ASSIGNMENT = "assignment"                      # Assignation
    CONCLUSIONS = "conclusions"                    # Conclusions
    DONATION = "donation"                          # Donation
    SUCCESSION = "succession"                      # Succession
    NDA = "nda"                                    # Accord de confidentialité
    PARTNERSHIP = "partnership"                    # Contrat de société
    MANDATE = "mandate"                            # Mandat
    POWER_OF_ATTORNEY = "power_of_attorney"        # Procuration
    CUSTOM = "custom"                              # Type personnalisé


class DataInputFormat(str, Enum):
    """Format d'entrée des données client"""
    TEXT = "text"                                  # Texte libre
    JSON = "json"                                  # JSON structuré
    FORM = "form"                                  # Formulaire web
    CSV = "csv"                                    # CSV


class OutputFormat(str, Enum):
    """Format de sortie de l'acte"""
    TEXT = "text"                                  # Texte brut
    PDF = "pdf"                                    # PDF généré
    DOCX = "docx"                                  # Word
    HTML = "html"                                  # HTML


class ActGenerationRequest(BaseModel):
    """Requête de génération d'acte"""
    
    act_type: ActType = Field(..., description="Type d'acte à générer")
    
    # Modèle source (un des deux obligatoire)
    template_content: Optional[str] = Field(
        None,
        description="Contenu du modèle (texte brut)"
    )
    template_file: Optional[str] = Field(
        None,
        description="Chemin vers fichier modèle (PDF/DOCX)"
    )
    
    # Données client
    client_data: str = Field(
        ...,
        description="Données du client (texte libre ou JSON)"
    )
    client_data_format: DataInputFormat = Field(
        default=DataInputFormat.TEXT,
        description="Format des données client"
    )
    
    # Options
    output_format: OutputFormat = Field(
        default=OutputFormat.TEXT,
        description="Format de sortie souhaité"
    )
    preserve_formatting: bool = Field(
        default=True,
        description="Préserver la mise en forme du modèle"
    )
    
    # Templates personnalisés (optionnel)
    custom_prompt: Optional[str] = Field(
        None,
        description="Prompt personnalisé créé par l'utilisateur"
    )
    custom_template_name: Optional[str] = Field(
        None,
        description="Nom du template personnalisé (pour sauvegarde)"
    )


class ActGenerationResponse(BaseModel):
    """Réponse de génération d'acte"""
    
    act_type: ActType = Field(..., description="Type d'acte généré")
    generated_act: str = Field(..., description="Acte généré (texte ou base64)")
    preview_text: str = Field("", description="Aperçu textuel (premiers 500 chars)")
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Score de confiance de la génération"
    )
    validation_required: bool = Field(
        default=True,
        description="Validation manuelle requise avant export"
    )
    output_format: OutputFormat = Field(..., description="Format du fichier généré")
    warnings: list[str] = Field(
        default_factory=list,
        description="Avertissements éventuels"
    )
    generated_at: datetime = Field(
        default_factory=datetime.now,
        description="Date de génération"
    )


class CustomTemplate(BaseModel):
    """Template personnalisé créé par l'utilisateur"""
    
    template_id: str = Field(..., description="ID unique du template")
    template_name: str = Field(..., description="Nom du template")
    act_type: ActType = Field(..., description="Type d'acte associé")
    custom_prompt: str = Field(..., description="Prompt personnalisé")
    template_content: Optional[str] = Field(
        None,
        description="Contenu du modèle (optionnel)"
    )
    created_by: str = Field(..., description="Créateur du template")
    created_at: datetime = Field(default_factory=datetime.now)
    last_used: Optional[datetime] = Field(None, description="Dernière utilisation")


# ============================================================================
# SYNTHÈSE - MODÈLES
# ============================================================================

class SynthesisType(str, Enum):
    """Types de synthèse disponibles"""
    STRATEGIC_NOTE = "strategic_note"          # Note stratégique (avocat)
    TREND_ANALYSIS = "trend_analysis"          # Analyse de tendances
    CLIENT_REPORT = "client_report"            # Rapport client (vulgarisé)
    CASE_SUMMARY = "case_summary"              # Résumé de cas (brief)
    PROCEDURAL_TIMELINE = "procedural_timeline"  # Chronologie procédurale


class SynthesisRequest(BaseModel):
    """Requête de synthèse de dossier"""
    
    synthesis_type: SynthesisType = Field(
        default=SynthesisType.STRATEGIC_NOTE,
        description="Type de synthèse demandée"
    )
    # Format frontend (objets avec content, title, date)
    documents: Optional[list[Any]] = Field(
        None,
        description="Documents au format frontend (content, title, date) ou liste de strings"
    )
    # Format backend (liste de strings)
    documents_content: Optional[list[str]] = Field(
        None,
        description="Contenu textuel des documents (si fourni directement)"
    )
    documents_files: Optional[list[str]] = Field(
        None,
        description="Chemins vers les fichiers PDF/DOCX à analyser"
    )
    enrich_with_rag: bool = Field(
        False,
        description="Enrichir avec jurisprudence via RAG"
    )
    search_query: Optional[str] = Field(
        None,
        description="Requête de recherche pour enrichissement RAG"
    )
    jurisdiction: Optional[str] = Field(
        None,
        description="Juridiction pour analyse de tendances"
    )
    date_range_start: Optional[datetime] = Field(
        None,
        description="Date de début pour analyse de tendances"
    )
    date_range_end: Optional[datetime] = Field(
        None,
        description="Date de fin pour analyse de tendances"
    )
    context: Optional[str] = Field(
        None,
        description="Contexte additionnel pour la synthèse"
    )
    output_format: Optional[str] = Field(
        "text",
        description="Format de sortie (text ou pdf)"
    )


class SynthesisResponse(BaseModel):
    """Réponse de synthèse"""
    
    synthesis_id: Optional[str] = Field(None, description="ID de la synthèse")
    synthesis_type: SynthesisType = Field(..., description="Type de synthèse générée")
    summary: str = Field(..., description="Synthèse complète")
    synthesized_content: Optional[str] = Field(None, description="Synthèse complète (alias pour frontend)")
    key_points: list[str] = Field(
        default_factory=list,
        description="Points clés extraits"
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Recommandations stratégiques"
    )
    confidence: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Score de confiance (0-1)"
    )
    generated_at: datetime = Field(
        default_factory=datetime.now,
        description="Date de génération"
    )
    
    def model_post_init(self, __context) -> None:
        """Initialise synthesized_content depuis summary si non fourni"""
        if self.synthesized_content is None:
            object.__setattr__(self, 'synthesized_content', self.summary)


# ============================================================================
# AUDIT - MODÈLES
# ============================================================================

class IssueSeverity(str, Enum):
    """Gravité d'un problème de conformité"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AuditRequest(BaseModel):
    """Requête d'audit de conformité"""
    
    # Support ancien format (contract_text)
    contract_text: Optional[str] = Field(None, description="Contenu du contrat (ancien format)")
    contract_date: Optional[str] = Field(None, description="Date du contrat (ancien format)")
    deep_analysis: bool = Field(False, description="Analyse approfondie")
    
    # Nouveau format
    document_title: Optional[str] = Field(None, description="Titre du document à auditer")
    document_content: Optional[str] = Field(
        None,
        description="Contenu textuel du document (si fourni directement)"
    )
    document_file_path: Optional[str] = Field(
        None,
        description="Chemin vers le fichier PDF/DOCX à auditer"
    )
    document_date: Optional[datetime] = Field(
        None,
        description="Date du document (signature/rédaction)"
    )
    check_live: bool = Field(
        False,
        description="Vérifier en temps réel via MCP Légifrance (désactivé pour MVP)"
    )
    detailed_report: bool = Field(
        True,
        description="Générer un rapport détaillé"
    )
    
    @field_validator('contract_text', 'document_content', 'document_file_path', mode='after')
    @classmethod
    def validate_at_least_one_content(cls, v, info):
        """Valide qu'au moins un champ de contenu est fourni"""
        # Cette validation sera faite dans la méthode audit()
        return v
    
    def model_post_init(self, __context) -> None:
        """Validation : au moins un champ de contenu doit être fourni"""
        # Support ancien format (contract_text) et nouveau format
        has_content = (
            bool(self.contract_text) or 
            bool(self.document_content) or 
            bool(self.document_file_path)
        )
        if not has_content:
            raise ValueError(
                "Vous devez fournir au moins un champ de contenu : "
                "contract_text (ancien format), document_content, ou document_file_path"
            )


class AuditIssue(BaseModel):
    """Un problème de conformité détecté"""
    
    severity: IssueSeverity = Field(..., description="Gravité du problème")
    issue_type: str = Field(..., description="Type de problème")
    article_reference: str = Field(..., description="Référence juridique concernée")
    context: str = Field("", description="Contexte de la référence dans le document")
    description: str = Field(..., description="Description du problème")
    current_status: str = Field(..., description="Statut actuel (VIGUEUR/ABROGE/MODIFIE)")
    date_abrogation: Optional[str] = Field(None, description="Date d'abrogation si applicable")
    date_modification: Optional[str] = Field(None, description="Date de modification si applicable")
    recommendation: str = Field(..., description="Recommandation de mise à jour")


class AuditResponse(BaseModel):
    """Réponse d'audit"""
    
    document_title: str = Field(..., description="Titre du document audité")
    audit_date: datetime = Field(default_factory=datetime.now, description="Date de l'audit")
    document_date: Optional[datetime] = Field(None, description="Date du document")
    total_references: int = Field(0, description="Nombre total de références juridiques")
    valid_references: int = Field(0, description="Nombre de références valides")
    issues: list[AuditIssue] = Field(
        default_factory=list,
        description="Problèmes détectés"
    )
    conformity_score: float = Field(
        0,
        ge=0,
        le=100,
        description="Score de conformité (0-100%)"
    )
    recommendations: list[str] = Field(
        default_factory=list,
        description="Recommandations globales de mise à jour"
    )


# ============================================================================
# ERREURS
# ============================================================================

class ErrorResponse(BaseModel):
    """Réponse d'erreur standard"""
    
    error: str = Field(..., description="Type d'erreur")
    message: str = Field(..., description="Message d'erreur détaillé")
    details: Optional[dict[str, Any]] = Field(
        None,
        description="Détails supplémentaires"
    )

