"""
Gestionnaire de templates PDF

Stocke, charge et gère les templates PDF personnalisés.
"""

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from loguru import logger


class PDFTemplateManager:
    """
    Gestion des templates PDF
    
    Structure :
    templates/pdf_templates/
    ├── default/
    │   └── template.json
    └── custom/
        ├── cabinet_dupont/
        │   ├── template.json
        │   ├── logo.png (optionnel)
        │   └── metadata.json
        └── cabinet_martin/
            └── ...
    """
    
    def __init__(self, templates_dir: str | Path = "templates/pdf_templates"):
        """
        Initialise le gestionnaire
        
        Args:
            templates_dir: Répertoire racine des templates
        """
        self.templates_dir = Path(templates_dir)
        self.default_dir = self.templates_dir / "default"
        self.custom_dir = self.templates_dir / "custom"
        
        # Créer les répertoires
        self.default_dir.mkdir(parents=True, exist_ok=True)
        self.custom_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"✅ TemplateManager initialisé : {self.templates_dir}")
    
    def save_template(
        self,
        template_name: str,
        template_config: dict[str, Any],
        logo_path: str | Path | None = None,
        is_default: bool = False
    ) -> Path:
        """
        Sauvegarde un template
        
        Args:
            template_name: Nom du template (ex: "cabinet_dupont")
            template_config: Configuration JSON du template
            logo_path: Chemin vers le logo (optionnel)
            is_default: Si True, sauvegarde comme template par défaut
        
        Returns:
            Chemin du dossier du template
        """
        # Nettoyer le nom du template
        template_name = template_name.lower().replace(" ", "_")
        
        # Déterminer le répertoire
        if is_default:
            template_dir = self.default_dir
        else:
            template_dir = self.custom_dir / template_name
        
        template_dir.mkdir(parents=True, exist_ok=True)
        
        # Sauvegarder la configuration
        config_path = template_dir / "template.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(template_config, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Template sauvegardé : {config_path}")
        
        # Copier le logo si fourni
        if logo_path:
            logo_path = Path(logo_path)
            if logo_path.exists():
                logo_dest = template_dir / f"logo{logo_path.suffix}"
                shutil.copy(logo_path, logo_dest)
                logger.info(f"✅ Logo copié : {logo_dest}")
        
        # Sauvegarder les métadonnées
        metadata = {
            "template_name": template_name,
            "created_at": datetime.now().isoformat(),
            "is_default": is_default,
            "has_logo": logo_path is not None,
        }
        
        metadata_path = template_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return template_dir
    
    def load_template(
        self,
        template_name: str | None = None
    ) -> dict[str, Any]:
        """
        Charge un template
        
        Args:
            template_name: Nom du template (None = défaut)
        
        Returns:
            Configuration du template
        """
        if template_name is None or template_name == "default":
            # Template par défaut
            template_dir = self.default_dir
        else:
            # Template personnalisé
            template_name = template_name.lower().replace(" ", "_")
            template_dir = self.custom_dir / template_name
        
        config_path = template_dir / "template.json"
        
        if not config_path.exists():
            logger.warning(f"⚠️ Template introuvable : {template_name}")
            return self._get_fallback_template()
        
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        
        # Ajouter le chemin du logo s'il existe
        logo_files = list(template_dir.glob("logo.*"))
        if logo_files:
            config["logo_path"] = str(logo_files[0])
        
        logger.info(f"✅ Template chargé : {template_name or 'default'}")
        return config
    
    def list_templates(self) -> list[dict[str, Any]]:
        """
        Liste tous les templates disponibles
        
        Returns:
            Liste des templates avec métadonnées
        """
        templates = []
        
        # Template par défaut
        default_config = self.default_dir / "template.json"
        if default_config.exists():
            templates.append({
                "name": "default",
                "path": str(self.default_dir),
                "is_default": True,
            })
        
        # Templates personnalisés
        for template_dir in self.custom_dir.iterdir():
            if template_dir.is_dir():
                metadata_path = template_dir / "metadata.json"
                if metadata_path.exists():
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)
                    templates.append({
                        "name": template_dir.name,
                        "path": str(template_dir),
                        "is_default": False,
                        **metadata
                    })
        
        return templates
    
    def delete_template(self, template_name: str) -> bool:
        """
        Supprime un template
        
        Args:
            template_name: Nom du template
        
        Returns:
            True si succès
        """
        if template_name == "default":
            logger.warning("⚠️ Impossible de supprimer le template par défaut")
            return False
        
        template_name = template_name.lower().replace(" ", "_")
        template_dir = self.custom_dir / template_name
        
        if not template_dir.exists():
            logger.warning(f"⚠️ Template introuvable : {template_name}")
            return False
        
        shutil.rmtree(template_dir)
        logger.success(f"✅ Template supprimé : {template_name}")
        return True
    
    def _get_fallback_template(self) -> dict[str, Any]:
        """
        Retourne un template de secours minimal
        
        Returns:
            Template minimal
        """
        logger.warning("⚠️ Utilisation du template de secours")
        
        return {
            "template_name": "Fallback",
            "document_type": "autre",
            "header": {
                "has_logo": False,
                "text": "",
                "font": "Helvetica",
                "font_size": 12,
                "color": "#000000",
                "alignment": "center"
            },
            "footer": {
                "text": "",
                "font_size": 9,
                "color": "#666666",
                "has_page_numbers": True,
                "alignment": "center"
            },
            "page": {
                "format": "A4",
                "orientation": "portrait",
                "margin_top": 72,
                "margin_bottom": 72,
                "margin_left": 72,
                "margin_right": 72
            },
            "styles": {
                "title_font": "Helvetica-Bold",
                "title_size": 16,
                "title_color": "#000000",
                "body_font": "Helvetica",
                "body_size": 11,
                "body_color": "#000000",
                "line_spacing": 1.5
            }
        }


# Point d'entrée pour tests
if __name__ == "__main__":
    from config.logging_config import setup_logging
    
    setup_logging()
    
    logger.info("="*70)
    logger.info("🧪 TEST DU GESTIONNAIRE DE TEMPLATES")
    logger.info("="*70)
    logger.info("")
    
    manager = PDFTemplateManager()
    
    # Créer un template de test
    test_template = {
        "template_name": "Cabinet Test",
        "document_type": "contrat",
        "header": {
            "has_logo": True,
            "text": "CABINET TEST & ASSOCIÉS",
            "font": "Helvetica-Bold",
            "font_size": 14,
            "color": "#003366",
            "alignment": "center"
        },
        "footer": {
            "text": "10 rue Test, 75001 Paris | contact@test.com",
            "font_size": 9,
            "color": "#666666",
            "has_page_numbers": True,
            "alignment": "center"
        },
        "page": {
            "format": "A4",
            "orientation": "portrait",
            "margin_top": 80,
            "margin_bottom": 60,
            "margin_left": 50,
            "margin_right": 50
        },
        "styles": {
            "title_font": "Helvetica-Bold",
            "title_size": 18,
            "title_color": "#003366",
            "body_font": "Helvetica",
            "body_size": 11,
            "body_color": "#000000",
            "line_spacing": 1.5
        }
    }
    
    # Sauvegarder
    logger.info("📝 Sauvegarde du template de test...")
    manager.save_template("cabinet_test", test_template)
    logger.info("")
    
    # Lister
    logger.info("📋 Liste des templates :")
    templates = manager.list_templates()
    for t in templates:
        logger.info(f"   • {t['name']} ({'défaut' if t['is_default'] else 'personnalisé'})")
    logger.info("")
    
    # Charger
    logger.info("📥 Chargement du template...")
    loaded = manager.load_template("cabinet_test")
    logger.info(f"   • Template : {loaded['template_name']}")
    logger.info(f"   • Type : {loaded['document_type']}")
    logger.info("")
    
    logger.success("✅ TEST TERMINÉ")

