"""
Pilier 4 : Synthèse et Aide à la Stratégie

Fonctionnalités :
- Synthèse de dossiers procéduraux
- Analyse de tendances jurisprudentielles
- Génération de rapports clients
- Résumés de cas
"""

from datetime import datetime
from pathlib import Path
from typing import Any

import google.generativeai as genai
from loguru import logger

from api.models import (
    SynthesisRequest,
    SynthesisResponse,
    SynthesisType,
    TrendAnalysis,
)
from config.logging_config import setup_logging
from config.settings import get_settings
from rag.vertex_search import VertexSearchClient

# Import des prompts centralisés
from prompts.prompts import (
    PROMPT_STRATEGIC_NOTE,
    PROMPT_TREND_ANALYSIS,
    PROMPT_CLIENT_REPORT,
    PROMPT_CASE_SUMMARY,
    PROMPT_PROCEDURAL_TIMELINE,
)

setup_logging()
settings = get_settings()

# Configuration Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def extract_text_from_file(file_path: str) -> str:
    """
    Extrait le texte d'un fichier (PDF, DOCX, TXT)
    
    Args:
        file_path: Chemin vers le fichier
    
    Returns:
        Texte extrait
    
    Raises:
        ValueError: Si le format n'est pas supporté
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError(
            "PyMuPDF n'est pas installé. "
            "Installez-le avec : pip install pymupdf"
        )
    
    file_path = Path(file_path)
    extension = file_path.suffix.lower()
    
    if extension == ".pdf":
        logger.info(f"📄 Extraction PDF : {file_path.name}")
        doc = fitz.open(str(file_path))
        text_parts = []
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text)
        doc.close()
        return "\n\n".join(text_parts)
    
    elif extension in [".docx", ".doc"]:
        logger.info(f"📄 Extraction DOCX : {file_path.name}")
        try:
            from docx import Document
        except ImportError:
            raise ImportError(
                "python-docx n'est pas installé. "
                "Installez-le avec : pip install python-docx"
            )
        doc = Document(str(file_path))
        return "\n\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    
    elif extension == ".txt":
        logger.info(f"📄 Lecture TXT : {file_path.name}")
        return file_path.read_text(encoding="utf-8")
    
    else:
        raise ValueError(
            f"Format non supporté : {extension}\n"
            f"Formats acceptés : .pdf, .docx, .txt"
        )


class SynthesisAideStrategie:
    """
    Système de synthèse et d'aide à la décision stratégique
    
    Fonctionnalités :
    - Note stratégique (pour avocat)
    - Analyse de tendances (jurisprudence)
    - Rapport client (vulgarisé)
    - Résumé de cas (brief)
    - Chronologie procédurale
    """
    
    def __init__(self):
        """Initialise le système de synthèse"""
        self.vertex_client = VertexSearchClient()
        
        # Configuration Gemini
        if settings.GEMINI_API_KEY:
            self.model_pro = genai.GenerativeModel(settings.GEMINI_PRO_MODEL)
            self.model_flash = genai.GenerativeModel(settings.GEMINI_FLASH_MODEL)
        else:
            logger.warning("⚠️ GEMINI_API_KEY non définie - synthèse désactivée")
            self.model_pro = None
            self.model_flash = None
        
        # Map type → prompt template
        self.prompt_templates = {
            SynthesisType.STRATEGIC_NOTE: PROMPT_STRATEGIC_NOTE,
            SynthesisType.TREND_ANALYSIS: PROMPT_TREND_ANALYSIS,
            SynthesisType.CLIENT_REPORT: PROMPT_CLIENT_REPORT,
            SynthesisType.CASE_SUMMARY: PROMPT_CASE_SUMMARY,
            SynthesisType.PROCEDURAL_TIMELINE: PROMPT_PROCEDURAL_TIMELINE,
        }
        
        logger.info("✅ SynthesisAideStrategie initialisé")
    
    def synthesize(self, request: SynthesisRequest) -> SynthesisResponse:
        """
        Génère une synthèse selon le type demandé
        
        Args:
            request: Requête de synthèse avec documents et options
        
        Returns:
            Synthèse générée
        """
        logger.info(f"🎯 Synthèse demandée : {request.synthesis_type.value}")
        
        # 1. Obtenir le contenu des documents
        documents_text = self._get_documents_content(request)
        
        if not documents_text:
            logger.error("❌ Aucun document fourni")
            error_msg = "❌ Erreur : Aucun document fourni"
            return SynthesisResponse(
                synthesis_id=f"synth_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                synthesis_type=request.synthesis_type,
                summary=error_msg,
                synthesized_content=error_msg,
                key_points=[],
                recommendations=[],
                confidence=0.0,
            )
        
        logger.info(f"📄 {len(documents_text)} document(s) à analyser")
        
        # 2. Enrichir avec RAG si demandé
        if request.enrich_with_rag and request.search_query:
            rag_context = self._enrich_with_rag(request.search_query)
            documents_text.append(f"\n\n--- JURISPRUDENCE PERTINENTE ---\n{rag_context}")
        
        # 3. Générer la synthèse selon le type
        result = self._generate_synthesis(
            synthesis_type=request.synthesis_type,
            documents=documents_text,
            request=request,
        )
        
        logger.success(f"✅ Synthèse générée : {request.synthesis_type.value}")
        return result
    
    def _get_documents_content(self, request: SynthesisRequest) -> list[str]:
        """
        Obtient le contenu des documents (texte ou fichiers)
        
        Returns:
            Liste de textes
        """
        documents = []
        
        # Option 1 : Format frontend (objets avec content, title, date)
        if request.documents:
            logger.debug(f"📄 Format frontend détecté : {len(request.documents)} document(s)")
            for doc in request.documents:
                if isinstance(doc, dict) and 'content' in doc:
                    content = doc.get('content', '')
                    if content:
                        documents.append(content)
                        logger.debug(f"  ✅ Document ajouté : {len(content)} caractères")
                elif isinstance(doc, str):
                    if doc:
                        documents.append(doc)
                        logger.debug(f"  ✅ Document string ajouté : {len(doc)} caractères")
        
        # Option 2 : Format backend (liste de strings)
        if request.documents_content:
            logger.debug(f"📄 Format backend détecté : {len(request.documents_content)} document(s)")
            documents.extend(request.documents_content)
        
        # Option 3 : Fichiers
        if request.documents_files:
            logger.debug(f"📄 Format fichiers détecté : {len(request.documents_files)} fichier(s)")
            for file_path in request.documents_files:
                try:
                    text = extract_text_from_file(file_path)
                    documents.append(text)
                except Exception as e:
                    logger.warning(f"⚠️ Erreur extraction {file_path}: {e}")
        
        logger.info(f"📚 Total documents extraits : {len(documents)}")
        return documents
    
    def _enrich_with_rag(self, query: str) -> str:
        """
        Enrichit avec de la jurisprudence via RAG
        
        Args:
            query: Requête de recherche
        
        Returns:
            Contexte enrichi
        """
        try:
            logger.info(f"🔍 Enrichissement RAG : '{query}'")
            results = self.vertex_client.search(query=query, page_size=5)
            
            if not results:
                return ""
            
            # Formater les résultats
            context_parts = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Document")
                content = result.get("content", "")
                context_parts.append(f"[{i}] {title}\n{content[:500]}...")
            
            return "\n\n".join(context_parts)
        
        except Exception as e:
            logger.warning(f"⚠️ Erreur enrichissement RAG: {e}")
            return ""
    
    def _generate_synthesis(
        self,
        synthesis_type: SynthesisType,
        documents: list[str],
        request: SynthesisRequest,
    ) -> SynthesisResponse:
        """
        Génère la synthèse avec Gemini
        
        Args:
            synthesis_type: Type de synthèse
            documents: Contenu des documents
            request: Requête complète
        
        Returns:
            Synthèse générée
        """
        if not self.model_pro:
            return SynthesisResponse(
                synthesis_type=synthesis_type,
                summary="❌ Gemini non configuré (GEMINI_API_KEY manquante)",
                key_points=[],
                recommendations=[],
                confidence=0.0,
            )
        
        # Sélectionner le template de prompt
        prompt_template = self.prompt_templates.get(synthesis_type)
        if not prompt_template:
            raise ValueError(f"Type de synthèse non supporté : {synthesis_type}")
        
        # Concaténer les documents
        documents_text = "\n\n---\n\n".join(documents)
        
        # Construire le prompt selon le type
        if synthesis_type == SynthesisType.STRATEGIC_NOTE:
            prompt = prompt_template.format(documents=documents_text)
            model = self.model_pro  # Pro pour analyses complexes
        
        elif synthesis_type == SynthesisType.TREND_ANALYSIS:
            prompt = prompt_template.format(
                jurisprudence=documents_text,
                query=request.search_query or "Non spécifiée",
                date_range=f"{request.date_range_start or 'N/A'} - {request.date_range_end or 'N/A'}",
                jurisdiction=request.jurisdiction or "Toutes",
            )
            model = self.model_pro
        
        elif synthesis_type == SynthesisType.CLIENT_REPORT:
            prompt = prompt_template.format(internal_summary=documents_text)
            model = self.model_flash  # Flash pour vulgarisation
        
        elif synthesis_type in [SynthesisType.CASE_SUMMARY, SynthesisType.PROCEDURAL_TIMELINE]:
            prompt = prompt_template.format(documents=documents_text)
            model = self.model_flash  # Flash pour résumés
        
        else:
            prompt = prompt_template.format(documents=documents_text)
            model = self.model_flash
        
        # Générer avec Gemini
        try:
            # Vérifier que le modèle est disponible
            if model is None:
                raise ValueError("Modèle Gemini non initialisé (GEMINI_API_KEY manquante)")
            
            logger.info(f"🤖 Génération avec {model.model_name}...")
            logger.debug(f"📝 Prompt length: {len(prompt)} caractères")
            
            # Vérifier la taille du prompt (limite Gemini)
            if len(prompt) > 1000000:  # ~1M caractères
                logger.warning(f"⚠️ Prompt très long ({len(prompt)} caractères), risque de dépassement")
            
            response = model.generate_content(prompt)
            
            # Vérifier que la réponse contient du texte
            if not response:
                logger.error("❌ Réponse Gemini None")
                raise ValueError("Réponse Gemini vide (None)")
            
            if not hasattr(response, 'text'):
                logger.error(f"❌ Réponse Gemini sans attribut 'text': {type(response)}")
                raise ValueError("Réponse Gemini invalide (pas d'attribut 'text')")
            
            summary = response.text.strip()
            
            if not summary:
                logger.error("❌ Synthèse générée vide")
                raise ValueError("Synthèse générée vide")
            
            logger.info(f"✅ Synthèse générée : {len(summary)} caractères")
            
            # Extraire les points clés et recommandations
            try:
                key_points = self._extract_key_points(summary)
                recommendations = self._extract_recommendations(summary)
            except Exception as e:
                logger.warning(f"⚠️ Erreur extraction points clés/recommandations: {e}")
                key_points = []
                recommendations = []
            
            # Calculer confiance (basique pour MVP)
            confidence = 0.85 if len(summary) > 500 else 0.70
            
            return SynthesisResponse(
                synthesis_id=f"synth_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                synthesis_type=synthesis_type,
                summary=summary,
                synthesized_content=summary,  # Alias pour frontend
                key_points=key_points,
                recommendations=recommendations,
                confidence=confidence,
                generated_at=datetime.now(),
            )
        
        except ValueError as e:
            # Erreur de validation (modèle non initialisé, réponse vide, etc.)
            logger.error(f"❌ Erreur validation génération: {e}")
            import traceback
            logger.error(traceback.format_exc())
            error_msg = f"❌ Erreur de validation lors de la génération : {str(e)}"
            return SynthesisResponse(
                synthesis_id=f"synth_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                synthesis_type=synthesis_type,
                summary=error_msg,
                synthesized_content=error_msg,  # Alias pour frontend
                key_points=[],
                recommendations=[],
                confidence=0.0,
                generated_at=datetime.now(),
            )
        except Exception as e:
            # Autres erreurs (API, réseau, etc.)
            logger.error(f"❌ Erreur génération Gemini: {e}")
            import traceback
            logger.error(traceback.format_exc())
            error_msg = f"❌ Erreur lors de la génération : {str(e)}"
            return SynthesisResponse(
                synthesis_id=f"synth_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                synthesis_type=synthesis_type,
                summary=error_msg,
                synthesized_content=error_msg,  # Alias pour frontend
                key_points=[],
                recommendations=[],
                confidence=0.0,
                generated_at=datetime.now(),
            )
    
    def _extract_key_points(self, text: str) -> list[str]:
        """
        Extrait les points clés d'un texte
        
        Args:
            text: Texte à analyser
        
        Returns:
            Liste de points clés
        """
        # Rechercher les sections avec numérotation ou bullet points
        key_points = []
        
        for line in text.split("\n"):
            line = line.strip()
            # Lignes qui commencent par un bullet ou un numéro
            if line and (
                line.startswith("-") or
                line.startswith("•") or
                line.startswith("*") or
                (len(line) > 2 and line[0].isdigit() and line[1] in ".)")
            ):
                # Nettoyer
                cleaned = line.lstrip("-•*0123456789. )")
                if cleaned and len(cleaned) > 10:  # Ignorer lignes trop courtes
                    key_points.append(cleaned[:200])  # Max 200 chars
        
        return key_points[:10]  # Max 10 points
    
    def _extract_recommendations(self, text: str) -> list[str]:
        """
        Extrait les recommandations d'un texte
        
        Args:
            text: Texte à analyser
        
        Returns:
            Liste de recommandations
        """
        recommendations = []
        
        # Chercher section "recommandations" ou "stratégie"
        lines = text.split("\n")
        in_reco_section = False
        
        for line in lines:
            line_lower = line.lower()
            
            # Détecter début de section
            if any(keyword in line_lower for keyword in [
                "recommand", "stratég", "conseil", "action", "étape"
            ]):
                in_reco_section = True
                continue
            
            # Détecter fin de section
            if in_reco_section and line.strip() and line[0].isdigit() and "." in line[:5]:
                in_reco_section = False
            
            # Extraire recommandations
            if in_reco_section:
                line = line.strip()
                if line and (line.startswith("-") or line.startswith("•")):
                    cleaned = line.lstrip("-•* ")
                    if cleaned and len(cleaned) > 10:
                        recommendations.append(cleaned[:200])
        
        return recommendations[:10]  # Max 10 recommandations


# Point d'entrée pour tests
if __name__ == "__main__":
    logger.info("="*70)
    logger.info("🧪 TEST DU PILIER 4 - SYNTHÈSE ET STRATÉGIE")
    logger.info("="*70)
    logger.info("")
    
    # Document de test
    test_doc = """
    ASSIGNATION EN JUSTICE
    
    Tribunal Judiciaire de Paris
    
    ENTRE :
    Monsieur Jean DUPONT, demeurant à Paris
    DEMANDEUR
    
    ET :
    Société ABC SAS, siège social à Lyon
    DÉFENDERESSE
    
    OBJET : Licenciement abusif
    
    FAITS :
    - Embauche le 15/01/2020
    - Licenciement économique le 30/06/2023
    - Absence de plan de sauvegarde de l'emploi
    - Salaire : 3 500 € brut/mois
    
    DEMANDES :
    - Réintégration ou indemnisation
    - 50 000 € de dommages et intérêts
    - Remboursement des frais de justice
    """
    
    # Test synthèse stratégique
    synthesizer = SynthesisAideStrategie()
    
    request = SynthesisRequest(
        synthesis_type=SynthesisType.STRATEGIC_NOTE,
        documents_content=[test_doc],
    )
    
    result = synthesizer.synthesize(request)
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Type : {result.synthesis_type.value}")
    logger.info(f"Confiance : {result.confidence:.0%}")
    logger.info("")
    logger.info("📝 SYNTHÈSE:")
    logger.info(result.summary[:500] + "...")
    logger.info("")
    logger.info(f"🎯 Points clés : {len(result.key_points)}")
    for point in result.key_points[:3]:
        logger.info(f"  • {point}")
    logger.info("")
    logger.success("✅ TEST TERMINÉ")

