"""
Client pour télécharger les données depuis data.gouv.fr

Page LEGI : https://www.data.gouv.fr/fr/datasets/legi-codes-lois-et-reglements-consolides/
"""

import json
import requests
from pathlib import Path
from typing import Dict, List, Optional, Any

from config.logging_config import get_logger

logger = get_logger(__name__)


class DataGouvClient:
    """Client pour télécharger depuis data.gouv.fr"""
    
    BASE_URL = "https://www.data.gouv.fr/api/1"
    DATASET_ID = "legi-codes-lois-et-reglements-consolides"  # ID du dataset LEGI
    
    def __init__(self, download_dir: Path = Path("data/raw/datagouv")):
        """
        Initialise le client data.gouv.fr
        
        Args:
            download_dir: Dossier pour télécharger les fichiers
        """
        self.download_dir = download_dir
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("✅ DataGouvClient initialisé")
    
    def get_dataset_info(self) -> Optional[Dict]:
        """
        Récupère les informations du dataset LEGI
        
        Returns:
            Dict avec infos du dataset, ou None si erreur
        """
        try:
            url = f"{self.BASE_URL}/datasets/{self.DATASET_ID}/"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Dataset trouvé: {data.get('title', 'N/A')}")
                return data
            else:
                logger.warning(f"⚠️ Status {response.status_code} pour dataset")
                return None
        
        except Exception as e:
            logger.error(f"❌ Erreur récupération dataset: {e}")
            return None
    
    def list_resources(self) -> List[Dict]:
        """
        Liste les ressources disponibles dans le dataset LEGI
        
        Returns:
            Liste des ressources (fichiers disponibles)
        """
        dataset_info = self.get_dataset_info()
        
        if not dataset_info:
            return []
        
        resources = dataset_info.get('resources', [])
        
        logger.info(f"📦 {len(resources)} ressources trouvées")
        
        for resource in resources:
            logger.info(f"   - {resource.get('title', 'N/A')} ({resource.get('format', 'N/A')})")
        
        return resources
    
    def download_resource(
        self,
        resource: Dict,
        output_path: Optional[Path] = None
    ) -> Optional[Path]:
        """
        Télécharge une ressource du dataset
        
        Args:
            resource: Dict avec infos de la ressource
            output_path: Chemin de destination (optionnel)
        
        Returns:
            Chemin du fichier téléchargé, ou None si erreur
        """
        try:
            url = resource.get('url')
            if not url:
                logger.warning("⚠️ Pas d'URL dans la ressource")
                return None
            
            title = resource.get('title', 'resource')
            format_type = resource.get('format', 'bin')
            
            if not output_path:
                # Générer un nom de fichier
                filename = f"{title.replace(' ', '_')}.{format_type}"
                output_path = self.download_dir / filename
            
            logger.info(f"📥 Téléchargement: {title}")
            logger.info(f"   URL: {url}")
            
            response = requests.get(url, stream=True, timeout=60)
            
            if response.status_code == 200:
                total_size = int(response.headers.get('content-length', 0))
                if total_size > 0:
                    logger.info(f"   Taille: {total_size / 1024 / 1024:.1f} MB")
                
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(output_path, "wb") as f:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0 and downloaded % (1024 * 1024) == 0:
                                progress = (downloaded / total_size) * 100
                                logger.debug(f"   Progression: {progress:.0f}%")
                
                logger.success(f"   ✅ Téléchargé: {output_path}")
                return output_path
            else:
                logger.warning(f"   ⚠️ Status {response.status_code}")
                return None
        
        except Exception as e:
            logger.error(f"   ❌ Erreur téléchargement: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def parse_legi_index(self, html_path: Path) -> List[Dict[str, str]]:
        """
        Parse la page d'index HTML pour trouver les archives disponibles
        
        Args:
            html_path: Chemin vers le fichier HTML d'index
        
        Returns:
            Liste des archives avec URL et taille
        """
        try:
            from bs4 import BeautifulSoup
            
            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            archives = []
            
            # Chercher tous les liens vers .tar.gz
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if href.endswith('.tar.gz'):
                    # Trouver la ligne complète pour extraire la taille
                    parent = link.parent
                    if parent:
                        text = parent.get_text()
                        # Extraire la taille (ex: "1.1G", "939K")
                        import re
                        size_match = re.search(r'(\d+\.?\d*[KMGT]?)', text)
                        size = size_match.group(1) if size_match else "0"
                        
                        # Construire l'URL complète
                        base_url = "https://echanges.dila.gouv.fr/OPENDATA/LEGI/"
                        full_url = base_url + href
                        
                        archives.append({
                            'name': href,
                            'url': full_url,
                            'size': size,
                        })
            
            # Trier par nom (le plus récent en premier)
            archives.sort(key=lambda x: x['name'], reverse=True)
            
            logger.info(f"📦 {len(archives)} archives trouvées")
            
            # Afficher les 5 plus récentes
            for arch in archives[:5]:
                logger.info(f"   - {arch['name']} ({arch['size']})")
            
            return archives
        
        except Exception as e:
            logger.error(f"❌ Erreur parsing index: {e}")
            return []
    
    def download_freemium_archive(self) -> Optional[Path]:
        """
        Télécharge l'archive Freemium complète (la plus récente)
        
        Returns:
            Chemin vers l'archive téléchargée, ou None si erreur
        """
        # Télécharger d'abord la page d'index
        resources = self.list_resources()
        
        xml_resource = None
        for resource in resources:
            title = resource.get('title', '').lower()
            if 'base' in title and 'legi' in title:
                xml_resource = resource
                break
        
        if not xml_resource and resources:
            # Prendre la première ressource XML
            for resource in resources:
                if resource.get('format', '').lower() == 'xml':
                    xml_resource = resource
                    break
        
        if not xml_resource:
            logger.warning("⚠️ Ressource index non trouvée")
            # Télécharger directement depuis l'URL connue
            logger.info("   Tentative téléchargement direct depuis DILA...")
            index_url = "https://echanges.dila.gouv.fr/OPENDATA/LEGI/"
            index_path = self.download_dir / "legi_index.html"
            
            try:
                response = requests.get(index_url, timeout=30)
                if response.status_code == 200:
                    with open(index_path, "wb") as f:
                        f.write(response.content)
                    logger.success(f"   ✅ Index téléchargé: {index_path}")
                else:
                    logger.warning(f"   ⚠️ Status {response.status_code}")
                    return None
            except Exception as e:
                logger.error(f"   ❌ Erreur: {e}")
                return None
        else:
            # Télécharger l'index via la ressource
            index_path = self.download_resource(xml_resource)
            if not index_path:
                return None
        
        # Télécharger l'index
        index_path = self.download_resource(xml_resource)
        if not index_path:
            return None
        
        # Parser l'index (peut être HTML ou XML)
        if index_path.suffix == '.html' or 'index' in index_path.name.lower():
            archives = self.parse_legi_index(index_path)
        else:
            # Si c'est déjà un XML, essayer de le parser comme index HTML
            archives = self.parse_legi_index(index_path)
        
        if not archives:
            logger.warning("⚠️ Aucune archive trouvée dans l'index")
            return None
        
        # Trouver l'archive Freemium (la plus récente)
        freemium_archives = [a for a in archives if 'freemium' in a['name'].lower()]
        
        if not freemium_archives:
            logger.warning("⚠️ Aucune archive Freemium trouvée")
            # Utiliser la plus récente archive LEGI
            logger.info("   Utilisation de la plus récente archive LEGI")
            target_archive = archives[0]
        else:
            target_archive = freemium_archives[0]
        
        logger.info(f"📥 Téléchargement: {target_archive['name']} ({target_archive['size']})")
        
        # Télécharger l'archive
        output_path = self.download_dir / target_archive['name']
        
        try:
            response = requests.get(target_archive['url'], stream=True, timeout=300)
            
            if response.status_code == 200:
                total_size = int(response.headers.get('content-length', 0))
                if total_size > 0:
                    logger.info(f"   Taille: {total_size / 1024 / 1024:.1f} MB")
                
                with open(output_path, "wb") as f:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0 and downloaded % (10 * 1024 * 1024) == 0:
                                progress = (downloaded / total_size) * 100
                                logger.info(f"   Progression: {progress:.0f}%")
                
                logger.success(f"   ✅ Téléchargé: {output_path}")
                return output_path
            else:
                logger.warning(f"   ⚠️ Status {response.status_code}")
                return None
        
        except Exception as e:
            logger.error(f"   ❌ Erreur: {e}")
            return None
    
    def download_all_resources(self) -> List[Path]:
        """
        Télécharge toutes les ressources du dataset LEGI
        
        Returns:
            Liste des fichiers téléchargés
        """
        resources = self.list_resources()
        
        if not resources:
            logger.warning("⚠️ Aucune ressource trouvée")
            return []
        
        downloaded_files = []
        
        for resource in resources:
            file_path = self.download_resource(resource)
            if file_path:
                downloaded_files.append(file_path)
        
        logger.success(f"✅ {len(downloaded_files)} fichiers téléchargés")
        return downloaded_files


def test_datagouv():
    """Test du client data.gouv.fr"""
    client = DataGouvClient()
    
    # Lister les ressources
    resources = client.list_resources()
    
    # Télécharger toutes les ressources
    if resources:
        files = client.download_all_resources()
        print(f"\n✅ {len(files)} fichiers téléchargés")
        for f in files:
            print(f"   - {f}")


if __name__ == "__main__":
    test_datagouv()

