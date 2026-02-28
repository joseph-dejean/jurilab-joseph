"""
Pilier 1 : Machine à Actes

Génération automatique d'actes juridiques par mimétisme intelligent.
Transforme un acte modèle + données client → nouvel acte personnalisé.
"""

from datetime import datetime
from pathlib import Path
from typing import Any

import vertexai
from vertexai.generative_models import GenerativeModel
from loguru import logger

from api.models import (
    ActGenerationRequest,
    ActGenerationResponse,
    ActType,
    DataInputFormat,
    OutputFormat,
)
from config.logging_config import setup_logging
from config.settings import get_settings

# Import des prompts centralisés
from prompts.prompts import PROMPT_ACT_GENERATION, PROMPT_ACT_GENERATION_CUSTOM

setup_logging()
settings = get_settings()

# Vertex AI init (uses ADC — no API key needed on Cloud Run)
vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)


def extract_text_from_file(file_path: str) -> str:
    """
    Extrait le texte d'un fichier (PDF, DOCX, TXT)
    
    Args:
        file_path: Chemin vers le fichier
    
    Returns:
        Texte extrait
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


class MachineActes:
    """
    Système de génération automatique d'actes juridiques
    
    Fonctionnalités :
    - Génération par mimétisme de style
    - Support multi-formats (texte, PDF, DOCX)
    - Liaison intelligente (pas de variables fixes)
    - Templates personnalisables
    - Validation avant export
    """
    
    def __init__(self):
        """Initialise la machine à actes"""
        
        # Configuration Gemini via Vertex AI (ADC)
        self.model_name = settings.GEMINI_FLASH_MODEL
        self.model = GenerativeModel(self.model_name)
        logger.info(f"✅ Utilisation de {self.model_name}")
        
        logger.info("✅ MachineActes initialisé")
    
    def generate(self, request: ActGenerationRequest) -> ActGenerationResponse:
        """
        Génère un acte juridique personnalisé
        
        Args:
            request: Requête de génération avec modèle et données
        
        Returns:
            Acte généré avec aperçu et métadonnées
        """
        logger.info(f"🎯 Génération d'acte : {request.act_type.value}")
        
        # 1. Obtenir le contenu du modèle
        template = self._get_template_content(request)
        
        if not template:
            logger.error("❌ Aucun modèle fourni")
            return ActGenerationResponse(
                act_type=request.act_type,
                generated_act="",
                preview_text="",
                confidence=0.0,
                output_format=request.output_format,
                warnings=["❌ Erreur : Aucun modèle fourni"],
            )
        
        logger.info(f"📄 Modèle chargé ({len(template)} caractères)")
        
        # 2. Préparer les données client
        client_data = self._prepare_client_data(request)
        logger.info(f"📋 Données client préparées")
        
        # 3. Générer l'acte avec Gemini
        generated_act, confidence, warnings = self._generate_with_ai(
            act_type=request.act_type,
            template=template,
            client_data=client_data,
            custom_prompt=request.custom_prompt,
        )
        
        # 4. Post-traitement selon format de sortie
        final_act = self._post_process(
            generated_act,
            request.output_format,
            request.preserve_formatting
        )
        
        # 5. Générer l'aperçu (s'assurer qu'il n'est jamais None)
        if final_act and len(final_act) > 0:
            preview = final_act[:500] + "..." if len(final_act) > 500 else final_act
        else:
            preview = ""
        
        # S'assurer que tous les champs sont valides
        response = ActGenerationResponse(
            act_type=request.act_type,
            generated_act=final_act or "",  # Toujours une string, jamais None
            preview_text=preview or "",  # Toujours une string, jamais None
            confidence=confidence or 0.0,  # Toujours un float, jamais None
            validation_required=True,
            output_format=request.output_format,
            warnings=warnings or [],  # Toujours une liste, jamais None
        )
        
        logger.success(f"✅ Acte généré (confiance: {confidence:.0%})")
        return response
    
    def _get_template_content(self, request: ActGenerationRequest) -> str:
        """
        Obtient le contenu du modèle (texte ou fichier)
        
        Returns:
            Contenu du modèle (limité à 200K caractères pour éviter dépassement tokens)
        """
        MAX_TEMPLATE_SIZE = 200000  # ~50K tokens max
        
        # Option 1 : Contenu direct
        if request.template_content:
            template = request.template_content
            if len(template) > MAX_TEMPLATE_SIZE:
                logger.warning(f"⚠️ Template trop gros ({len(template)} chars), tronqué à {MAX_TEMPLATE_SIZE}")
                template = template[:MAX_TEMPLATE_SIZE] + "\n\n[... Template tronqué pour éviter dépassement de tokens ...]"
            return template
        
        # Option 2 : Fichier
        if request.template_file:
            try:
                template = extract_text_from_file(request.template_file)
                if len(template) > MAX_TEMPLATE_SIZE:
                    logger.warning(f"⚠️ Template PDF trop gros ({len(template)} chars), tronqué à {MAX_TEMPLATE_SIZE}")
                    template = template[:MAX_TEMPLATE_SIZE] + "\n\n[... Template tronqué pour éviter dépassement de tokens ...]"
                return template
            except Exception as e:
                logger.error(f"❌ Erreur extraction modèle : {e}")
                return ""
        
        return ""
    
    def _prepare_client_data(self, request: ActGenerationRequest) -> str:
        """
        Prépare les données client selon le format
        
        Returns:
            Données formatées pour le prompt
        """
        data = request.client_data
        
        # Si JSON, formatter proprement
        if request.client_data_format == DataInputFormat.JSON:
            try:
                import json
                parsed = json.loads(data)
                # Reformatter en liste claire
                formatted = "\n".join([f"{key}: {value}" for key, value in parsed.items()])
                return formatted
            except:
                # Si parsing échoue, retourner tel quel
                return data
        
        # Si CSV, formatter
        if request.client_data_format == DataInputFormat.CSV:
            # Convertir CSV en liste
            lines = data.strip().split("\n")
            if len(lines) > 1:
                headers = lines[0].split(",")
                values = lines[1].split(",")
                formatted = "\n".join([f"{h.strip()}: {v.strip()}" for h, v in zip(headers, values)])
                return formatted
        
        # Texte brut ou form : retourner tel quel
        return data
    
    def _generate_with_ai(
        self,
        act_type: ActType,
        template: str,
        client_data: str,
        custom_prompt: str | None = None,
    ) -> tuple[str, float, list[str]]:
        """
        Génère l'acte avec Gemini
        
        Returns:
            Tuple (acte généré, confiance, warnings)
        """
        if not self.model:
            return (
                "❌ Gemini non configuré (Vertex AI indisponible)",
                0.0,
                ["Configuration Vertex AI manquante"]
            )
        
        warnings = []
        
        # Choisir le prompt
        if custom_prompt:
            # Prompt personnalisé
            prompt = PROMPT_ACT_GENERATION_CUSTOM.format(
                custom_instructions=custom_prompt,
                template=template,
                client_data=client_data,
            )
            logger.info("📝 Utilisation du prompt personnalisé")
        else:
            # Prompt standard
            prompt = PROMPT_ACT_GENERATION.format(
                act_type=act_type.value,
                template=template,
                client_data=client_data,
            )
            logger.info("📝 Utilisation du prompt standard")
        
        # Générer avec Gemini
        try:
            logger.info(f"🤖 Génération avec {self.model_name}...")
            response = self.model.generate_content(prompt)
            generated_act = response.text.strip()
            
            # Vérifications basiques
            if len(generated_act) < 100:
                warnings.append("⚠️ Acte généré très court, vérification recommandée")
            
            if "[" in generated_act and "]" in generated_act:
                warnings.append("⚠️ Variables non substituées détectées ([...])")
            
            # Calculer confiance (basique pour MVP)
            confidence = 0.90 if not warnings else 0.75
            
            return generated_act, confidence, warnings
        
        except Exception as e:
            logger.error(f"❌ Erreur génération Gemini: {e}")
            return (
                f"❌ Erreur lors de la génération : {e}",
                0.0,
                [f"Erreur: {str(e)}"]
            )
    
    def _post_process(
        self,
        generated_act: str,
        output_format: OutputFormat,
        preserve_formatting: bool
    ) -> str:
        """
        Post-traitement selon le format de sortie
        
        Returns:
            Acte formaté
        """
        # Pour MVP, on retourne le texte tel quel
        # Dans une version complète, on pourrait :
        # - Générer PDF avec reportlab
        # - Générer DOCX avec python-docx
        # - Générer HTML avec templates
        
        if output_format == OutputFormat.TEXT:
            return generated_act
        
        elif output_format == OutputFormat.HTML:
            # Conversion basique texte → HTML
            html = generated_act.replace("\n\n", "</p><p>")
            html = f"<html><body><p>{html}</p></body></html>"
            return html
        
        else:
            # PDF et DOCX nécessitent des bibliothèques supplémentaires
            # Pour MVP, on retourne le texte avec un warning
            logger.warning(f"⚠️ Format {output_format.value} pas encore implémenté, retour texte")
            return generated_act


# Point d'entrée pour tests
if __name__ == "__main__":
    logger.info("="*70)
    logger.info("🧪 TEST DE LA MACHINE À ACTES")
    logger.info("="*70)
    logger.info("")
    
    # Acte modèle simple
    template_test = """
    CONTRAT DE VENTE
    
    Entre les soussignés :
    
    Monsieur Jean DURAND, demeurant à 5 rue de la République, 69001 Lyon
    ci-après dénommé "le Vendeur"
    
    ET
    
    Madame Marie LEBLANC, demeurant à 12 avenue des Champs, 75008 Paris
    ci-après dénommée "l'Acheteur"
    
    Il a été convenu ce qui suit :
    
    ARTICLE 1 - OBJET
    Le Vendeur cède à l'Acheteur un véhicule automobile de marque Renault.
    
    ARTICLE 2 - PRIX
    Le prix de vente est fixé à cinquante mille (50 000) euros.
    
    ARTICLE 3 - PAIEMENT
    Le paiement sera effectué par virement bancaire à la signature.
    
    Fait à Lyon, le 15 janvier 2020
    En deux exemplaires originaux
    
    Signature du Vendeur          Signature de l'Acheteur
    """
    
    # Données du nouveau client
    client_data_test = """
    Vendeur : Pierre MARTIN, 10 rue de la Paix, 75001 Paris
    Acheteur : Sophie DUPONT, 25 avenue Victor Hugo, 69003 Lyon
    Véhicule : Mercedes Classe A
    Prix : 75 000 euros
    Lieu : Paris
    Date : 18 décembre 2025
    """
    
    # Créer la requête
    request = ActGenerationRequest(
        act_type=ActType.CONTRACT_SALE,
        template_content=template_test,
        client_data=client_data_test,
        client_data_format=DataInputFormat.TEXT,
        output_format=OutputFormat.TEXT,
    )
    
    # Générer
    machine = MachineActes()
    result = machine.generate(request)
    
    # Afficher
    logger.info("")
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Type : {result.act_type.value}")
    logger.info(f"Confiance : {result.confidence:.0%}")
    logger.info(f"Format : {result.output_format.value}")
    logger.info("")
    
    if result.warnings:
        logger.warning("⚠️ AVERTISSEMENTS :")
        for warning in result.warnings:
            logger.warning(f"  • {warning}")
        logger.info("")
    
    logger.info("📝 ACTE GÉNÉRÉ :")
    logger.info("="*70)
    print(result.generated_act)
    logger.info("="*70)
    logger.info("")
    logger.success("✅ TEST TERMINÉ")

