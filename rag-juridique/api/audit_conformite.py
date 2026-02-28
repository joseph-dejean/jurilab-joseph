"""
Pilier 3 : Audit et Conformité

Détecte les anachronismes dans les contrats et documents juridiques.
Vérifie la validité des références légales et propose des mises à jour.
"""

import re
from datetime import datetime
from pathlib import Path
from typing import Any

import vertexai
from vertexai.generative_models import GenerativeModel
from loguru import logger

from api.models import AuditRequest, AuditResponse, AuditIssue, IssueSeverity
from config.logging_config import setup_logging
from config.settings import get_settings
from rag.vertex_search import VertexSearchClient

setup_logging()
settings = get_settings()

# Vertex AI init (uses ADC — no API key needed on Cloud Run)
vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)


# ==============================================================================
# FONCTIONS D'EXTRACTION DE TEXTE
# ==============================================================================

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extrait le texte d'un fichier PDF avec haute précision
    
    Utilise PyMuPDF (fitz) qui est excellent pour les documents juridiques
    car il préserve la mise en forme et extrait le texte au caractère près.
    
    Args:
        file_path: Chemin vers le fichier PDF
    
    Returns:
        Texte extrait du PDF
    
    Raises:
        ImportError: Si PyMuPDF n'est pas installé
        FileNotFoundError: Si le fichier n'existe pas
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError(
            "PyMuPDF n'est pas installé. "
            "Installez-le avec : pip install pymupdf"
        )
    
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Fichier introuvable : {file_path}")
    
    logger.info(f"📄 Extraction du PDF : {file_path.name}")
    
    try:
        # Ouvrir le PDF
        doc = fitz.open(str(file_path))
        
        # Extraire le texte de toutes les pages
        text_parts = []
        has_images = False
        
        for page_num, page in enumerate(doc, 1):
            # Extraction avec préservation de la mise en forme
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text)
                logger.debug(f"  Page {page_num}: {len(text)} caractères")
            
            # Détecter si la page contient des images
            if len(page.get_images()) > 0:
                has_images = True
        
        doc.close()
        
        full_text = "\n\n".join(text_parts)
        
        # Si aucun texte mais des images détectées
        if len(full_text.strip()) == 0 and has_images:
            logger.warning(f"⚠️ PDF scanné détecté (images sans texte)")
            raise ValueError(
                "Ce PDF contient des images scannées sans texte extractible. "
                "L'extraction de texte depuis des PDF scannés nécessite l'OCR (reconnaissance optique de caractères), "
                "qui n'est pas encore implémenté. "
                "Veuillez utiliser un PDF avec du texte sélectionnable ou saisir le texte manuellement."
            )
        
        logger.success(f"✅ {len(text_parts)} pages extraites ({len(full_text)} caractères)")
        
        return full_text
        
    except Exception as e:
        logger.error(f"❌ Erreur extraction PDF : {e}")
        raise


def extract_text_from_docx(file_path: str) -> str:
    """
    Extrait le texte d'un fichier DOCX
    
    Args:
        file_path: Chemin vers le fichier DOCX
    
    Returns:
        Texte extrait du DOCX
    
    Raises:
        ImportError: Si python-docx n'est pas installé
        FileNotFoundError: Si le fichier n'existe pas
    """
    try:
        from docx import Document
    except ImportError:
        raise ImportError(
            "python-docx n'est pas installé. "
            "Installez-le avec : pip install python-docx"
        )
    
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Fichier introuvable : {file_path}")
    
    logger.info(f"📄 Extraction du DOCX : {file_path.name}")
    
    try:
        doc = Document(str(file_path))
        
        # Extraire tous les paragraphes
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        
        full_text = "\n\n".join(paragraphs)
        logger.success(f"✅ {len(paragraphs)} paragraphes extraits ({len(full_text)} caractères)")
        
        return full_text
        
    except Exception as e:
        logger.error(f"❌ Erreur extraction DOCX : {e}")
        raise


def extract_text_from_file(file_path: str) -> str:
    """
    Détecte le type de fichier et extrait le texte approprié
    
    Args:
        file_path: Chemin vers le fichier (PDF, DOCX, TXT)
    
    Returns:
        Texte extrait
    
    Raises:
        ValueError: Si le format n'est pas supporté
    """
    file_path = Path(file_path)
    extension = file_path.suffix.lower()
    
    if extension == ".pdf":
        return extract_text_from_pdf(str(file_path))
    elif extension in [".docx", ".doc"]:
        return extract_text_from_docx(str(file_path))
    elif extension == ".txt":
        # Texte brut
        logger.info(f"📄 Lecture du fichier texte : {file_path.name}")
        return file_path.read_text(encoding="utf-8")
    else:
        raise ValueError(
            f"Format de fichier non supporté : {extension}\n"
            f"Formats acceptés : .pdf, .docx, .txt"
        )


class AuditConformite:
    """
    Système d'audit et de conformité pour documents juridiques
    
    Détecte :
    - Articles abrogés
    - Articles modifiés
    - Références obsolètes
    - Incohérences temporelles
    """
    
    def __init__(self):
        """Initialise le système d'audit"""
        self.vertex_client = VertexSearchClient()
        
        # Configuration Gemini via Vertex AI (ADC)
        self.model = GenerativeModel(settings.GEMINI_PRO_MODEL)
        
        # Patterns de références juridiques (droit français)
        self.patterns = {
            # "article 1101 du Code civil"
            "article_code": re.compile(
                r"article\s+(\d+(?:-\d+)?)\s+(?:du\s+)?([Cc]ode\s+(?:civil|pénal|du\s+travail|de\s+commerce|de\s+procédure\s+civile))",
                re.IGNORECASE
            ),
            # "art. 1101 du Code civil" (abréviation)
            "article_abrege_code": re.compile(
                r"art\.\s+(\d+(?:-\d+)?)\s+(?:du\s+)?([Cc]ode\s+(?:civil|pénal|du\s+travail|de\s+commerce|de\s+procédure\s+civile))",
                re.IGNORECASE
            ),
            # "article premier" / "article 1er"
            "article_premier": re.compile(
                r"article\s+(premier|1er|1ère|première)\s+(?:du\s+)?([Cc]ode\s+(?:civil|pénal|du\s+travail|de\s+commerce|de\s+procédure\s+civile))",
                re.IGNORECASE
            ),
            # "L. 110-1" ou "L110-1" (notation légistique - Code de commerce)
            "notation_legistique": re.compile(
                r"L\.?\s*(\d+(?:-\d+)+)",
                re.IGNORECASE
            ),
            # "article 1101, alinéa 2" ou "article 1101, al. 2"
            "article_avec_alinea": re.compile(
                r"article\s+(\d+(?:-\d+)?),?\s+(?:alinéa|al\.)\s+(\d+)",
                re.IGNORECASE
            ),
            # "articles 1101 à 1105" (plage)
            "article_plage": re.compile(
                r"articles?\s+(\d+)\s+(?:à|au|et)\s+(\d+)\s+(?:du\s+)?([Cc]ode\s+(?:civil|pénal|du\s+travail|de\s+commerce|de\s+procédure\s+civile))",
                re.IGNORECASE
            ),
            # "article 1101" simple (sans code spécifié)
            "article_simple": re.compile(
                r"(?:l'|le|les\s+)?article[s]?\s+(\d+(?:-\d+)?)",
                re.IGNORECASE
            ),
        }
        
        logger.info("✅ AuditConformite initialisé")
    
    def audit(self, request: AuditRequest) -> AuditResponse:
        """
        Audite un document juridique
        
        Args:
            request: Requête d'audit avec document et options
        
        Returns:
            Rapport d'audit avec issues détectées
        """
        import traceback
        
        try:
            logger.info("🔍 [AUDIT] Début de l'audit...")
            
            # Support ancien et nouveau format
            document_title = request.document_title or "Document sans titre"
            document_content = request.contract_text or request.document_content or ""
            
            logger.debug(f"   Document title: {document_title}")
            logger.debug(f"   Content length: {len(document_content)} chars")
            logger.debug(f"   File path: {request.document_file_path}")
            
            # Validation : au moins un contenu doit être fourni
            if not document_content and not request.document_file_path:
                logger.warning("⚠️ Aucun contenu fourni pour l'audit")
                return AuditResponse(
                document_title=document_title,
                audit_date=datetime.now(),
                document_date=request.document_date,
                total_references=0,
                valid_references=0,
                issues=[],
                conformity_score=100,
                recommendations=["⚠️ Aucun contenu fourni pour l'audit. Veuillez fournir contract_text ou document_content."],
            )
        
            logger.info(f"🔍 [AUDIT] Audit du document: '{document_title}'")
            
            # 1. Obtenir le contenu du document
            logger.info("📄 [AUDIT] Étape 1: Extraction du contenu...")
            if request.document_file_path:
                # Extraire depuis un fichier
                try:
                    logger.debug(f"   Extraction depuis fichier: {request.document_file_path}")
                    document_content = extract_text_from_file(request.document_file_path)
                    logger.info(f"   ✅ Contenu extrait: {len(document_content)} caractères")
                except Exception as e:
                    logger.error(f"❌ [AUDIT] Erreur extraction fichier : {e}")
                    logger.error(traceback.format_exc())
                    # Retourner un rapport d'erreur
                    return AuditResponse(
                    document_title=document_title,
                    audit_date=datetime.now(),
                    document_date=request.document_date,
                    total_references=0,
                    valid_references=0,
                    issues=[],
                    conformity_score=0,
                        recommendations=[f"❌ Erreur lors de l'extraction du fichier : {type(e).__name__}: {str(e)}"],
                )
        
            # Vérifier qu'on a du contenu
            if not document_content or len(document_content.strip()) == 0:
                logger.warning("⚠️ [AUDIT] Document vide")
                return AuditResponse(
                document_title=document_title,
                audit_date=datetime.now(),
                document_date=request.document_date,
                total_references=0,
                valid_references=0,
                issues=[],
                conformity_score=100,
                recommendations=["⚠️ Le document est vide ou n'a pas pu être lu."],
            )
        
            # 2. Extraire les références juridiques
            logger.info("📝 [AUDIT] Étape 2: Extraction des références juridiques...")
            try:
                references = self._extract_legal_references(document_content)
                logger.info(f"   ✅ {len(references)} références extraites")
            except Exception as e:
                logger.error(f"❌ [AUDIT] Erreur extraction références: {type(e).__name__}: {str(e)}")
                logger.error(traceback.format_exc())
                raise  # Relancer l'erreur pour qu'elle soit capturée plus haut
        
            # 3. Extraire la date du document
            logger.info("📅 [AUDIT] Étape 3: Extraction de la date...")
            try:
                document_date = self._extract_document_date(request)
                logger.info(f"   ✅ Date extraite: {document_date}")
            except Exception as e:
                logger.warning(f"⚠️ [AUDIT] Erreur extraction date: {e}")
                document_date = None
        
            # 4. Vérifier chaque référence
            logger.info("🔍 [AUDIT] Étape 4: Vérification des références...")
            issues = []
            valid_refs = 0
            
            try:
                for i, ref in enumerate(references):
                    try:
                        issue = self._verify_reference(ref, document_date)
                        if issue:
                            issues.append(issue)
                        else:
                            valid_refs += 1
                    except Exception as e:
                        logger.warning(f"⚠️ [AUDIT] Erreur vérification référence {i+1}/{len(references)}: {e}")
                        # Continuer avec les autres références
                        continue
                
                logger.info(f"   ✅ {valid_refs} références valides, ⚠️ {len(issues)} problèmes détectés")
            except Exception as e:
                logger.error(f"❌ [AUDIT] Erreur lors de la vérification des références: {type(e).__name__}: {str(e)}")
                logger.error(traceback.format_exc())
                raise
        
            # 5. Calculer le score de conformité
            logger.info("📊 [AUDIT] Étape 5: Calcul du score de conformité...")
            total_refs = len(references)
            conformity_score = (valid_refs / total_refs * 100) if total_refs > 0 else 100
            logger.info(f"   ✅ Score: {conformity_score:.1f}%")
            
            # 6. Générer les recommandations avec Gemini
            logger.info("💡 [AUDIT] Étape 6: Génération des recommandations...")
            try:
                recommendations = self._generate_recommendations(
                    issues=issues,
                    document_title=document_title,
                    document_date=document_date,
                    total_refs=total_refs,
                    valid_refs=valid_refs
                )
                logger.info(f"   ✅ {len(recommendations)} recommandations générées")
            except Exception as e:
                logger.error(f"❌ [AUDIT] Erreur génération recommandations: {type(e).__name__}: {str(e)}")
                logger.error(traceback.format_exc())
                # Utiliser des recommandations par défaut
                recommendations = [
                    "⚠️ Impossible de générer des recommandations automatiques.",
                    "Consulter la liste des problèmes pour identifier les mises à jour nécessaires.",
                ]
            
            # 7. Construire la réponse
            logger.info("📦 [AUDIT] Étape 7: Construction de la réponse...")
            try:
                response = AuditResponse(
                    document_title=document_title,
                    audit_date=datetime.now(),
                    document_date=document_date,
                    total_references=total_refs,
                    valid_references=valid_refs,
                    issues=issues,
                    conformity_score=conformity_score,
                    recommendations=recommendations,
                )
                logger.success(f"✅ [AUDIT] Audit terminé (score: {conformity_score:.1f}%)")
                return response
            except Exception as e:
                logger.error(f"❌ [AUDIT] Erreur construction réponse: {type(e).__name__}: {str(e)}")
                logger.error(traceback.format_exc())
                raise
        
        except Exception as e:
            logger.error("=" * 70)
            logger.error("❌ [AUDIT] ERREUR CRITIQUE DANS LA MÉTHODE audit()")
            logger.error("=" * 70)
            logger.error(f"Type d'erreur: {type(e).__name__}")
            logger.error(f"Message: {str(e)}")
            logger.error(f"Traceback complet:")
            logger.error(traceback.format_exc())
            logger.error("=" * 70)
            # Relancer l'erreur pour qu'elle soit capturée par la route
            raise
    
    def _extract_legal_references(self, text: str) -> list[dict[str, Any]]:
        """
        Extrait les références juridiques du texte
        
        Returns:
            Liste de références avec leur position et contexte
        """
        references = []
        positions_seen = set()  # Éviter doublons
        
        def add_reference(ref: dict):
            """Ajoute une référence si pas déjà présente"""
            if ref["position"] not in positions_seen:
                references.append(ref)
                positions_seen.add(ref["position"])
        
        # 1. "article 1101 du Code civil"
        for match in self.patterns["article_code"].finditer(text):
            add_reference({
                "type": "article_code",
                "article_num": match.group(1),
                "code_name": match.group(2).lower(),
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 2. "art. 1101 du Code civil" (abréviation)
        for match in self.patterns["article_abrege_code"].finditer(text):
            add_reference({
                "type": "article_abrege",
                "article_num": match.group(1),
                "code_name": match.group(2).lower(),
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 3. "article premier" / "article 1er"
        for match in self.patterns["article_premier"].finditer(text):
            add_reference({
                "type": "article_premier",
                "article_num": "1",  # Normaliser à "1"
                "code_name": match.group(2).lower(),
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 4. "L. 110-1" (notation légistique)
        for match in self.patterns["notation_legistique"].finditer(text):
            add_reference({
                "type": "notation_legistique",
                "article_num": match.group(1),
                "code_name": "code de commerce",  # Par défaut, notation L = Code commerce
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 5. "article 1101, alinéa 2"
        for match in self.patterns["article_avec_alinea"].finditer(text):
            add_reference({
                "type": "article_alinea",
                "article_num": match.group(1),
                "alinea_num": match.group(2),
                "code_name": None,  # Déterminé par contexte
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 6. "articles 1101 à 1105" (plage)
        for match in self.patterns["article_plage"].finditer(text):
            # Pour MVP, on vérifie juste le premier article de la plage
            add_reference({
                "type": "article_plage",
                "article_num": match.group(1),  # Premier article
                "article_num_fin": match.group(2),  # Dernier article
                "code_name": match.group(3).lower(),
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # 7. "article 1101" simple (sans code)
        for match in self.patterns["article_simple"].finditer(text):
            add_reference({
                "type": "article_simple",
                "article_num": match.group(1),
                "code_name": None,
                "full_text": match.group(0),
                "position": match.start(),
                "context": text[max(0, match.start()-50):min(len(text), match.end()+50)].strip(),
            })
        
        # Trier par position
        references.sort(key=lambda x: x["position"])
        
        return references
    
    def _extract_document_date(self, request: AuditRequest) -> datetime | None:
        """
        Extrait la date du document
        
        Priorité :
        1. Date fournie dans la requête
        2. Date extraite du contenu
        """
        # Date fournie explicitement
        if request.document_date:
            return request.document_date
        
        # Chercher une date dans le contenu (patterns typiques)
        # "Fait à Paris, le 15 janvier 2020"
        # "Date de signature : 15/01/2020"
        date_patterns = [
            r"[Ff]ait\s+à\s+\w+,?\s+le\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})",
            r"[Dd]ate\s+de\s+signature\s*:\s*(\d{1,2})[/-](\d{1,2})[/-](\d{4})",
            r"[Ss]igné\s+le\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})",
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, request.document_content)
            if match:
                try:
                    # Parser la date (simplifié pour MVP)
                    # TODO: Parser correctement les différents formats
                    logger.debug(f"Date extraite du document: {match.group(0)}")
                    return None  # Pour MVP, on ne parse pas encore
                except Exception as e:
                    logger.debug(f"Erreur parsing date: {e}")
        
        return None
    
    def _verify_reference(
        self,
        reference: dict[str, Any],
        document_date: datetime | None
    ) -> AuditIssue | None:
        """
        Vérifie la validité d'une référence juridique
        
        Returns:
            AuditIssue si problème détecté, None sinon
        """
        article_num = reference["article_num"]
        code_name = reference["code_name"]
        
        # Construire la requête de recherche
        if code_name:
            query = f"article {article_num} {code_name}"
        else:
            query = f"article {article_num}"
        
        try:
            # Rechercher dans Vertex AI
            results = self.vertex_client.search(query=query, page_size=3)
            
            if not results:
                # Aucun résultat trouvé
                return AuditIssue(
                    severity=IssueSeverity.HIGH,
                    issue_type="reference_not_found",
                    article_reference=reference["full_text"],
                    context=reference["context"],
                    description=f"Référence introuvable : {reference['full_text']}",
                    current_status="INCONNU",
                    recommendation="Vérifier la référence ou la supprimer si obsolète.",
                )
            
            # Prendre le meilleur résultat
            best_match = results[0]
            metadata = best_match.get("metadata", {})
            etat = metadata.get("etat", "INCONNU")
            
            # Vérifier le statut
            if etat == "ABROGE":
                # Article abrogé
                date_fin = metadata.get("date_fin")
                return AuditIssue(
                    severity=IssueSeverity.CRITICAL,
                    issue_type="article_abroge",
                    article_reference=reference["full_text"],
                    context=reference["context"],
                    description=f"Article {article_num} abrogé",
                    current_status=etat,
                    date_abrogation=date_fin,
                    recommendation=f"Mettre à jour la référence (article abrogé le {date_fin or 'date inconnue'}).",
                )
            
            elif etat == "MODIFIE":
                # Article modifié
                date_debut = metadata.get("date_debut")
                
                # Vérifier si modifié après la date du document
                if document_date and date_debut:
                    try:
                        date_modif = datetime.fromisoformat(date_debut)
                        if date_modif > document_date:
                            return AuditIssue(
                                severity=IssueSeverity.HIGH,
                                issue_type="article_modifie",
                                article_reference=reference["full_text"],
                                context=reference["context"],
                                description=f"Article {article_num} modifié après la signature du document",
                                current_status=etat,
                                date_modification=date_debut,
                                recommendation=f"Vérifier que le contenu correspond à la version en vigueur au {date_modif.strftime('%d/%m/%Y')}.",
                            )
                    except Exception as e:
                        logger.debug(f"Erreur comparaison dates: {e}")
                
                # Article modifié mais pas d'anachronisme détecté
                return AuditIssue(
                    severity=IssueSeverity.LOW,
                    issue_type="article_modifie",
                    article_reference=reference["full_text"],
                    context=reference["context"],
                    description=f"Article {article_num} a été modifié",
                    current_status=etat,
                    date_modification=date_debut,
                    recommendation="Vérifier que la version citée correspond à la version actuelle.",
                )
            
            # Article en vigueur, pas de problème
            return None
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur vérification référence '{reference['full_text']}': {e}")
            return AuditIssue(
                severity=IssueSeverity.MEDIUM,
                issue_type="verification_error",
                article_reference=reference["full_text"],
                context=reference["context"],
                description=f"Impossible de vérifier la référence : {str(e)}",
                current_status="ERREUR",
                recommendation="Vérifier manuellement cette référence.",
            )
    
    def _generate_recommendations(
        self,
        issues: list[AuditIssue],
        document_title: str,
        document_date: datetime | None,
        total_refs: int,
        valid_refs: int,
    ) -> list[str]:
        """
        Génère des recommandations avec Gemini
        
        Returns:
            Liste de recommandations
        """
        if not self.model or not issues:
            # Recommandations par défaut
            if not issues:
                return ["✅ Le document est conforme. Aucune mise à jour nécessaire."]
            else:
                return [
                    "⚠️ Des problèmes de conformité ont été détectés.",
                    "Consulter la liste des problèmes ci-dessus pour plus de détails.",
                ]
        
        # Construire le prompt
        issues_summary = "\n".join([
            f"- {issue.severity.value.upper()}: {issue.description} ({issue.article_reference})"
            for issue in issues[:10]  # Max 10 pour ne pas surcharger
        ])
        
        prompt = f"""En tant qu'expert juridique, analyse ce rapport d'audit et propose des recommandations concrètes.

Document audité : {document_title}
Date du document : {document_date.strftime('%d/%m/%Y') if document_date else 'Non spécifiée'}

Statistiques :
- Références totales : {total_refs}
- Références valides : {valid_refs}
- Problèmes détectés : {len(issues)}

Problèmes identifiés :
{issues_summary}

Fournis 3 à 5 recommandations concrètes et actionnables pour mettre à jour ce document.
Format : liste à puces, une recommandation par ligne, commençant par un emoji approprié.
"""
        
        try:
            # Vérifier que le modèle est disponible
            if self.model is None:
                logger.warning("⚠️ Modèle Gemini non initialisé pour recommandations")
                return [
                    "⚠️ Impossible de générer des recommandations automatiques (Gemini non configuré).",
                    "Consulter la liste des problèmes pour identifier les mises à jour nécessaires.",
                ]
            
            response = self.model.generate_content(prompt)
            
            # Vérifier que la réponse contient du texte
            if not response or not hasattr(response, 'text'):
                logger.error("❌ Réponse Gemini vide ou invalide pour recommandations")
                raise ValueError("Réponse Gemini vide")
            
            recommendations_text = response.text.strip()
            
            if not recommendations_text:
                logger.warning("⚠️ Recommandations générées vides")
                return [
                    "⚠️ Impossible de générer des recommandations automatiques.",
                    "Consulter la liste des problèmes pour identifier les mises à jour nécessaires.",
                ]
            
            # Parser les recommandations (ligne par ligne)
            recommendations = [
                line.strip()
                for line in recommendations_text.split("\n")
                if line.strip() and (line.strip().startswith("-") or line.strip().startswith("•") or any(c in line for c in "🔴🟠🟡🟢🔵⚠️✅📝🔍"))
            ]
            
            if recommendations:
                logger.success(f"✅ {len(recommendations)} recommandations générées")
                return recommendations
            else:
                # Fallback si parsing échoue
                logger.warning("⚠️ Parsing recommandations échoué, utilisation du texte brut")
                return [recommendations_text]
        
        except ValueError as e:
            logger.error(f"❌ Erreur validation génération recommandations: {e}")
            return [
                "⚠️ Impossible de générer des recommandations automatiques.",
                "Consulter la liste des problèmes pour identifier les mises à jour nécessaires.",
            ]
        except Exception as e:
            logger.error(f"❌ Erreur génération recommandations: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return [
                "⚠️ Impossible de générer des recommandations automatiques.",
                "Consulter la liste des problèmes pour identifier les mises à jour nécessaires.",
            ]


# Point d'entrée pour tests
if __name__ == "__main__":
    logger.info("="*70)
    logger.info("🧪 TEST DU SYSTÈME D'AUDIT ET CONFORMITÉ")
    logger.info("="*70)
    logger.info("")
    
    # Document de test avec références obsolètes
    test_document = """
    CONTRAT DE VENTE
    
    Entre les soussignés :
    - Vendeur : Société ABC
    - Acheteur : Monsieur Jean Dupont
    
    Fait à Paris, le 15 janvier 2010
    
    ARTICLE 1 - Objet
    Conformément à l'article 1101 du Code civil, le présent contrat est un accord
    de volontés destiné à créer des obligations.
    
    ARTICLE 2 - Prix
    Le prix est fixé conformément à l'article 1591 du Code civil et aux articles
    L. 110-1 et suivants du Code de commerce.
    
    ARTICLE 3 - Capacité
    Les parties ont la pleine capacité juridique conformément à l'article 414
    du Code civil (majorité fixée à 18 ans).
    
    ARTICLE 4 - Formation du contrat
    Le contrat est formé selon les articles 1127 et suivants du Code civil.
    """
    
    # Créer la requête
    request = AuditRequest(
        document_title="Contrat de Vente 2010",
        document_content=test_document,
        document_date=datetime(2010, 1, 15),
    )
    
    # Auditer
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    # Afficher le résultat
    logger.info("")
    logger.info("📊 RÉSULTAT DE L'AUDIT")
    logger.info("="*70)
    logger.info(f"Document : {result.document_title}")
    logger.info(f"Score de conformité : {result.conformity_score:.1f}%")
    logger.info(f"Références totales : {result.total_references}")
    logger.info(f"Références valides : {result.valid_references}")
    logger.info(f"Problèmes détectés : {len(result.issues)}")
    logger.info("")
    
    if result.issues:
        logger.info("⚠️ PROBLÈMES DÉTECTÉS:")
        logger.info("-"*70)
        for i, issue in enumerate(result.issues, 1):
            logger.info(f"{i}. [{issue.severity.value.upper()}] {issue.description}")
            logger.info(f"   Référence: {issue.article_reference}")
            logger.info(f"   Recommandation: {issue.recommendation}")
            logger.info("")
    
    logger.info("💡 RECOMMANDATIONS:")
    logger.info("-"*70)
    for rec in result.recommendations:
        logger.info(f"   {rec}")
    
    logger.info("")
    logger.info("="*70)
    logger.info("✅ TEST TERMINÉ")
    logger.info("="*70)

