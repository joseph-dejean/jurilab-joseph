"""
Analyseur automatique de style PDF avec Gemini

Ce module utilise PyMuPDF pour extraire les métadonnées techniques du PDF,
puis Gemini pour analyser le style et générer un template JSON automatiquement.
"""

import json
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
import vertexai
from vertexai.generative_models import GenerativeModel
from loguru import logger

from config.settings import get_settings

settings = get_settings()

# Vertex AI init (uses ADC — no API key needed on Cloud Run)
vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)


class PDFStyleAnalyzer:
    """
    Analyse automatique du style d'un PDF
    
    Détecte :
    - Logo et images (position, taille)
    - En-tête et pied de page
    - Polices utilisées
    - Couleurs
    - Marges et espacement
    - Structure (titres, paragraphes, listes)
    """
    
    def __init__(self):
        """Initialise l'analyseur"""
        self.model = GenerativeModel(settings.GEMINI_PRO_MODEL)
    
    def analyze_pdf(self, pdf_path: str | Path) -> dict[str, Any]:
        """
        Analyse complète d'un PDF
        
        Args:
            pdf_path: Chemin vers le PDF
        
        Returns:
            JSON de configuration du template
        """
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF introuvable : {pdf_path}")
        
        logger.info(f"📄 Analyse du PDF : {pdf_path.name}")
        
        # 1. Extraction des métadonnées techniques
        technical_data = self._extract_technical_data(pdf_path)
        
        # 2. Extraction du texte structuré
        structured_text = self._extract_structured_text(pdf_path)
        
        # 3. Extraction des images (logos)
        images_data = self._extract_images(pdf_path)
        
        # 4. Analyse avec Gemini pour détecter le style
        style_config = self._analyze_with_gemini(
            technical_data,
            structured_text,
            images_data
        )
        
        logger.success(f"✅ Analyse terminée : {pdf_path.name}")
        return style_config
    
    def _extract_technical_data(self, pdf_path: Path) -> dict[str, Any]:
        """
        Extrait les métadonnées techniques du PDF
        
        Returns:
            Données techniques (polices, couleurs, marges)
        """
        logger.info("🔍 Extraction des métadonnées techniques...")
        
        doc = fitz.open(str(pdf_path))
        
        # Analyser la première page (pour le style général)
        first_page = doc[0]
        
        # Dimensions de la page
        page_rect = first_page.rect
        width = page_rect.width
        height = page_rect.height
        
        # Extraire les polices utilisées
        fonts = set()
        font_sizes = set()
        
        blocks = first_page.get_text("dict")["blocks"]
        for block in blocks:
            if block.get("type") == 0:  # Bloc de texte
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        font = span.get("font", "")
                        size = span.get("size", 0)
                        if font:
                            fonts.add(font)
                        if size:
                            font_sizes.add(round(size, 1))
        
        # Extraire les couleurs
        colors = set()
        for block in blocks:
            if block.get("type") == 0:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        color = span.get("color", 0)
                        if color:
                            colors.add(color)
        
        # Récupérer le nombre de pages AVANT de fermer
        total_pages = len(doc)
        
        doc.close()
        
        technical_data = {
            "page_dimensions": {
                "width": width,
                "height": height,
                "format": self._detect_page_format(width, height)
            },
            "fonts": list(fonts)[:5],  # Top 5 polices
            "font_sizes": sorted(list(font_sizes), reverse=True)[:5],
            "colors": [self._color_to_hex(c) for c in list(colors)[:5]],
            "total_pages": total_pages,
        }
        
        logger.info(f"   • Format : {technical_data['page_dimensions']['format']}")
        logger.info(f"   • Polices : {len(fonts)} différentes")
        logger.info(f"   • Couleurs : {len(colors)} différentes")
        
        return technical_data
    
    def _extract_structured_text(self, pdf_path: Path) -> dict[str, Any]:
        """
        Extrait le texte structuré (en-tête, corps, pied de page)
        
        Returns:
            Texte structuré par zones
        """
        logger.info("📝 Extraction du texte structuré...")
        
        doc = fitz.open(str(pdf_path))
        first_page = doc[0]
        page_height = first_page.rect.height
        
        # Diviser la page en zones
        header_zone = fitz.Rect(0, 0, first_page.rect.width, page_height * 0.15)
        body_zone = fitz.Rect(0, page_height * 0.15, first_page.rect.width, page_height * 0.85)
        footer_zone = fitz.Rect(0, page_height * 0.85, first_page.rect.width, page_height)
        
        # Extraire le texte par zone
        header_text = first_page.get_textbox(header_zone).strip()
        body_text = first_page.get_textbox(body_zone).strip()[:500]  # 500 premiers chars
        footer_text = first_page.get_textbox(footer_zone).strip()
        
        doc.close()
        
        structured = {
            "header": header_text,
            "body_preview": body_text,
            "footer": footer_text,
        }
        
        logger.info(f"   • En-tête : {len(header_text)} caractères")
        logger.info(f"   • Pied de page : {len(footer_text)} caractères")
        
        return structured
    
    def _extract_images(self, pdf_path: Path) -> dict[str, Any]:
        """
        Extrait les images (logos) du PDF
        
        Returns:
            Informations sur les images
        """
        logger.info("🖼️ Extraction des images...")
        
        doc = fitz.open(str(pdf_path))
        first_page = doc[0]
        
        images = []
        image_list = first_page.get_images()
        
        for img_index, img in enumerate(image_list[:3]):  # Max 3 premières images
            xref = img[0]
            
            # Récupérer l'image
            pix = fitz.Pixmap(doc, xref)
            
            # Position de l'image
            img_rects = first_page.get_image_rects(xref)
            if img_rects:
                rect = img_rects[0]
                position = {
                    "x": rect.x0,
                    "y": rect.y0,
                    "width": rect.width,
                    "height": rect.height,
                }
            else:
                position = None
            
            images.append({
                "index": img_index,
                "width": pix.width,
                "height": pix.height,
                "position": position,
            })
        
        doc.close()
        
        logger.info(f"   • {len(images)} image(s) détectée(s)")
        
        return {"images": images}
    
    def _analyze_with_gemini(
        self,
        technical_data: dict,
        structured_text: dict,
        images_data: dict
    ) -> dict[str, Any]:
        """
        Analyse avec Gemini pour générer le template JSON
        
        Returns:
            Configuration du template
        """
        if not self.model:
            logger.warning("⚠️ Gemini non configuré, retour template basique")
            return self._generate_basic_template(technical_data, structured_text)
        
        logger.info("🤖 Analyse du style avec Gemini...")
        
        # Construire le prompt pour Gemini
        prompt = f"""Tu es un expert en analyse de documents juridiques PDF.

Analyse ces données extraites d'un PDF et génère un template JSON pour reproduire EXACTEMENT le même style.

DONNÉES TECHNIQUES :
{json.dumps(technical_data, indent=2, ensure_ascii=False)}

TEXTE STRUCTURÉ :
En-tête : {structured_text.get('header', '')}
Pied de page : {structured_text.get('footer', '')}
Aperçu corps : {structured_text.get('body_preview', '')[:200]}...

IMAGES :
{json.dumps(images_data, indent=2, ensure_ascii=False)}

MISSION :
Génère un JSON de configuration qui permettra de reproduire ce style exact.

Format JSON attendu :
{{
  "template_name": "Nom du template (détecté du texte)",
  "document_type": "contrat|conclusion|autre",
  "header": {{
    "has_logo": true/false,
    "logo_position": "left|center|right",
    "text": "Texte de l'en-tête",
    "font": "Police détectée",
    "font_size": taille,
    "color": "#hexcolor",
    "alignment": "left|center|right"
  }},
  "footer": {{
    "text": "Texte du pied de page",
    "font_size": taille,
    "color": "#hexcolor",
    "has_page_numbers": true/false,
    "alignment": "center"
  }},
  "page": {{
    "format": "A4|Letter",
    "orientation": "portrait|landscape",
    "margin_top": valeur en points,
    "margin_bottom": valeur,
    "margin_left": valeur,
    "margin_right": valeur
  }},
  "styles": {{
    "title_font": "Police pour titres",
    "title_size": taille,
    "title_color": "#hexcolor",
    "body_font": "Police pour corps",
    "body_size": taille,
    "body_color": "#000000",
    "line_spacing": 1.5
  }}
}}

IMPORTANT :
- Déduis le nom du cabinet/avocat depuis l'en-tête
- Détecte si c'est un contrat, des conclusions, etc.
- Convertis les couleurs en hexadécimal
- Estime les marges (généralement 50-80 points)
- Réponds UNIQUEMENT avec le JSON, sans texte avant/après
"""
        
        try:
            response = self.model.generate_content(prompt)
            json_text = response.text.strip()
            
            # Nettoyer le JSON (retirer les ``` si présents)
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.startswith("```"):
                json_text = json_text[3:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]
            json_text = json_text.strip()
            
            # Parser le JSON
            config = json.loads(json_text)
            
            logger.success("✅ Template JSON généré par Gemini")
            return config
        
        except Exception as e:
            logger.error(f"❌ Erreur Gemini : {e}")
            logger.warning("⚠️ Retour au template basique")
            return self._generate_basic_template(technical_data, structured_text)
    
    def _generate_basic_template(
        self,
        technical_data: dict,
        structured_text: dict
    ) -> dict[str, Any]:
        """
        Génère un template basique sans Gemini
        
        Returns:
            Template minimal
        """
        return {
            "template_name": "Template basique",
            "document_type": "autre",
            "header": {
                "has_logo": False,
                "text": structured_text.get("header", ""),
                "font": technical_data["fonts"][0] if technical_data["fonts"] else "Arial",
                "font_size": 12,
                "color": "#000000",
                "alignment": "center"
            },
            "footer": {
                "text": structured_text.get("footer", ""),
                "font_size": 9,
                "color": "#666666",
                "has_page_numbers": True,
                "alignment": "center"
            },
            "page": {
                "format": technical_data["page_dimensions"]["format"],
                "orientation": "portrait",
                "margin_top": 72,
                "margin_bottom": 72,
                "margin_left": 72,
                "margin_right": 72
            },
            "styles": {
                "title_font": technical_data["fonts"][0] if technical_data["fonts"] else "Arial",
                "title_size": max(technical_data["font_sizes"]) if technical_data["font_sizes"] else 16,
                "title_color": "#000000",
                "body_font": technical_data["fonts"][0] if technical_data["fonts"] else "Arial",
                "body_size": 11,
                "body_color": "#000000",
                "line_spacing": 1.5
            }
        }
    
    def _detect_page_format(self, width: float, height: float) -> str:
        """Détecte le format de page (A4, Letter, etc.)"""
        # A4 : 595 x 842 points
        # Letter : 612 x 792 points
        
        if abs(width - 595) < 10 and abs(height - 842) < 10:
            return "A4"
        elif abs(width - 612) < 10 and abs(height - 792) < 10:
            return "Letter"
        else:
            return "Custom"
    
    def _color_to_hex(self, color_int: int) -> str:
        """Convertit un entier de couleur en hexadécimal"""
        # PyMuPDF utilise BGR, pas RGB
        r = (color_int >> 16) & 0xFF
        g = (color_int >> 8) & 0xFF
        b = color_int & 0xFF
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def save_template(
        self,
        template_config: dict,
        output_path: str | Path
    ) -> None:
        """
        Sauvegarde le template JSON
        
        Args:
            template_config: Configuration du template
            output_path: Chemin de sauvegarde
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(template_config, f, indent=2, ensure_ascii=False)
        
        logger.success(f"✅ Template sauvegardé : {output_path}")


# Point d'entrée pour tests
if __name__ == "__main__":
    from config.logging_config import setup_logging
    
    setup_logging()
    
    logger.info("="*70)
    logger.info("🧪 TEST DE L'ANALYSEUR DE STYLE PDF")
    logger.info("="*70)
    logger.info("")
    
    # Vérifier si des PDFs de test existent
    test_dir = Path("data/test_pdfs")
    pdf_files = list(test_dir.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning("⚠️ Aucun PDF trouvé dans data/test_pdfs/")
        logger.info("Déposez vos PDFs de test dans ce dossier et relancez le script.")
    else:
        logger.info(f"📄 {len(pdf_files)} PDF(s) trouvé(s) :")
        for pdf in pdf_files:
            logger.info(f"   • {pdf.name}")
        logger.info("")
        
        # Analyser le premier PDF
        analyzer = PDFStyleAnalyzer()
        
        for pdf_file in pdf_files:
            logger.info(f"🎯 Analyse de : {pdf_file.name}")
            logger.info("-"*70)
            
            try:
                template = analyzer.analyze_pdf(pdf_file)
                
                # Afficher le résultat
                logger.info("")
                logger.info("📊 TEMPLATE GÉNÉRÉ :")
                logger.info("="*70)
                print(json.dumps(template, indent=2, ensure_ascii=False))
                logger.info("="*70)
                logger.info("")
                
                # Sauvegarder
                output_file = test_dir / f"{pdf_file.stem}_template.json"
                analyzer.save_template(template, output_file)
                
            except Exception as e:
                logger.error(f"❌ Erreur : {e}")
                import traceback
                traceback.print_exc()
            
            logger.info("")
    
    logger.success("✅ TEST TERMINÉ")

