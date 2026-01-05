"""
Module d'ingestion depuis DILA OPENDATA

Source officielle : https://echanges.dila.gouv.fr/OPENDATA/LEGI/

Format : XML LEGI
Structure : Archives ZIP avec fichiers XML hiérarchiques
"""

import json
import re
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

import requests
from lxml import etree

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class DILAOpendataClient:
    """Client pour télécharger et parser les données DILA OPENDATA"""
    
    BASE_URL = "https://echanges.dila.gouv.fr/OPENDATA/LEGI/"
    
    # Mapping code_id → nom du code
    CODE_IDS = {
        "LEGITEXT000006070721": "Code civil",
        "LEGITEXT000006070716": "Code pénal",
        "LEGITEXT000006072050": "Code du travail",
        "LEGITEXT000005634379": "Code de commerce",
        "LEGITEXT000006071164": "Code de procédure civile",
        "LEGITEXT000006071164": "Code de procédure pénale",
        "LEGITEXT000006073189": "Code de la sécurité sociale",
    }
    
    def __init__(self, download_dir: Path = Path("data/raw/dila")):
        """
        Initialise le client DILA
        
        Args:
            download_dir: Dossier pour télécharger les archives
        """
        self.download_dir = download_dir
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        # Namespace XML LEGI
        self.ns = {
            'legi': 'http://www.legifrance.gouv.fr/XML/LEGI',
            'common': 'http://www.legifrance.gouv.fr/XML/COMMON'
        }
        
        logger.info("✅ DILAOpendataClient initialisé")
    
    def download_code(self, code_id: str) -> Optional[Path]:
        """
        Télécharge un code depuis DILA OPENDATA
        
        Args:
            code_id: ID du code (ex: LEGITEXT000006070721)
        
        Returns:
            Chemin vers le dossier extrait, ou None si échec
        """
        logger.info(f"📥 Téléchargement DILA: {code_id}")
        
        try:
            # Vérifier d'abord si on a déjà les fichiers locaux
            local_dir = self.download_dir / code_id
            if local_dir.exists():
                xml_files = self.find_xml_files(local_dir)
                if xml_files:
                    logger.info(f"   ✅ Fichiers locaux trouvés: {local_dir}")
                    return local_dir
            
            # Essayer plusieurs URLs possibles
            urls_to_try = [
                f"{self.BASE_URL}LEGI/{code_id}/LEGI.zip",
                f"{self.BASE_URL}LEGI/LEGI/{code_id}/LEGI.zip",
                f"{self.BASE_URL}{code_id}/LEGI.zip",
                f"{self.BASE_URL}LEGI/LEGI/LEGI/{code_id}/LEGI.zip",
                # Essayer aussi avec structure différente
                f"{self.BASE_URL}LEGI/LEGI/{code_id}.zip",
                f"{self.BASE_URL}LEGI/{code_id}.zip",
            ]
            
            # Essayer de scraper la page pour trouver les vraies URLs
            try:
                from bs4 import BeautifulSoup
                logger.info(f"   🔍 Scraping page DILA pour trouver URLs...")
                response = requests.get(self.BASE_URL, timeout=30)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    # Chercher tous les liens
                    for link in soup.find_all('a', href=True):
                        href = link.get('href', '')
                        # Si le lien contient le code_id ou LEGI
                        if code_id in href or ('LEGI' in href.upper() and code_id[:8] in href):
                            full_url = urljoin(self.BASE_URL, href)
                            if full_url not in urls_to_try:
                                urls_to_try.insert(0, full_url)  # Priorité aux URLs trouvées
                                logger.debug(f"   URL trouvée: {full_url}")
            except Exception as e:
                logger.debug(f"   Scraping échoué: {e}")
            
            logger.info(f"   🔍 {len(urls_to_try)} URLs à essayer")
            
            for url in urls_to_try:
                try:
                    logger.info(f"   Tentative: {url}")
                    response = requests.get(url, stream=True, timeout=30)
                    
                    if response.status_code == 200:
                        # Télécharger l'archive
                        zip_path = self.download_dir / f"{code_id}.zip"
                        
                        total_size = int(response.headers.get('content-length', 0))
                        logger.info(f"   Taille: {total_size / 1024 / 1024:.1f} MB")
                        
                        with open(zip_path, "wb") as f:
                            downloaded = 0
                            for chunk in response.iter_content(chunk_size=8192):
                                if chunk:
                                    f.write(chunk)
                                    downloaded += len(chunk)
                                    if total_size > 0:
                                        progress = (downloaded / total_size) * 100
                                        if int(progress) % 10 == 0:
                                            logger.debug(f"   Progression: {progress:.0f}%")
                        
                        logger.success(f"   ✅ Archive téléchargée: {zip_path}")
                        
                        # Extraire
                        extract_dir = self.download_dir / code_id
                        extract_dir.mkdir(exist_ok=True)
                        
                        logger.info(f"   📦 Extraction...")
                        with zipfile.ZipFile(zip_path, "r") as zip_ref:
                            zip_ref.extractall(extract_dir)
                        
                        logger.success(f"   ✅ Archive extraite: {extract_dir}")
                        return extract_dir
                    
                    elif response.status_code == 404:
                        logger.debug(f"   ❌ 404: {url}")
                        continue
                    else:
                        logger.warning(f"   ⚠️ Status {response.status_code}: {url}")
                        continue
                
                except requests.exceptions.RequestException as e:
                    logger.debug(f"   Erreur {url}: {e}")
                    continue
            
            logger.warning(f"   ⚠️ Aucune URL valide trouvée pour {code_id}")
            return None
        
        except Exception as e:
            logger.error(f"   ❌ Erreur téléchargement: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def find_xml_files(self, extract_dir: Path) -> List[Path]:
        """
        Trouve tous les fichiers XML d'articles dans un dossier extrait
        
        Args:
            extract_dir: Dossier extrait de l'archive
        
        Returns:
            Liste des chemins vers les fichiers XML
        """
        xml_files = []
        
        # Chercher dans différentes structures possibles
        patterns = [
            "**/LEGI/**/*.xml",
            "**/ARTICLES/**/*.xml",
            "**/*.xml",
        ]
        
        for pattern in patterns:
            found = list(extract_dir.glob(pattern))
            if found:
                xml_files.extend(found)
                break
        
        # Dédupliquer
        xml_files = list(set(xml_files))
        
        logger.info(f"   📄 {len(xml_files)} fichiers XML trouvés")
        return xml_files
    
    def parse_legi_xml(self, xml_path: Path) -> List[Dict[str, Any]]:
        """
        Parse un fichier XML LEGI et extrait les articles
        
        Supporte deux structures :
        1. Fichier = 1 article (tag racine = ARTICLE) - Archive Freemium
        2. Fichier avec plusieurs articles (.//ARTICLE) - DILA classique
        
        Args:
            xml_path: Chemin vers le fichier XML
        
        Returns:
            Liste d'articles avec métadonnées
        """
        articles = []
        
        try:
            # Parser avec lxml (plus robuste que xml.etree)
            tree = etree.parse(str(xml_path))
            root = tree.getroot()
            
            # CAS 1 : Le fichier EST un article (tag racine = ARTICLE)
            # C'est le cas pour l'archive Freemium extraite
            if root.tag == 'ARTICLE' or root.tag.endswith('}ARTICLE'):
                try:
                    article_data = self._extract_article(root, root, xml_path)
                    if article_data:
                        articles.append(article_data)
                except Exception as e:
                    logger.debug(f"   ⚠️ Erreur parsing article (racine): {e}")
            
            # CAS 2 : Chercher des articles dans le fichier
            # Structure classique DILA avec plusieurs articles
            else:
                article_elements = root.xpath(
                    './/legi:ARTICLE | .//ARTICLE',
                    namespaces=self.ns
                )
                
                if not article_elements:
                    # Essayer sans namespace
                    article_elements = root.findall('.//ARTICLE')
                
                for article_elem in article_elements:
                    try:
                        article_data = self._extract_article(article_elem, root, xml_path)
                        if article_data:
                            articles.append(article_data)
                    except Exception as e:
                        logger.debug(f"   ⚠️ Erreur parsing article: {e}")
                        continue
        
        except Exception as e:
            logger.warning(f"   ⚠️ Erreur parsing XML {xml_path}: {e}")
        
        return articles
    
    def _extract_article(
        self,
        article_elem: etree.Element,
        root: etree.Element,
        xml_path: Optional[Path] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Extrait les données d'un élément ARTICLE
        
        Args:
            article_elem: Élément XML ARTICLE
            root: Racine du document (pour métadonnées du code)
        
        Returns:
            Dict avec données de l'article, ou None si erreur
        """
        try:
            # Extraire métadonnées du code
            code_id = None
            code_name = None
            
            # Structure Freemium : META > META_COMMUN (métadonnées du code)
            meta = article_elem.find('META')
            if meta is not None:
                meta_commun = meta.find('META_COMMUN')
                if meta_commun is not None:
                    id_elem = meta_commun.find('ID')
                    if id_elem is not None:
                        code_id = id_elem.text
                    
                    titre_elem = meta_commun.find('TITRE')
                    if titre_elem is not None:
                        code_name = titre_elem.text
            
            # Si pas trouvé, chercher dans CONTEXTE > TEXTE
            if not code_id:
                contexte = article_elem.find('CONTEXTE')
                if contexte is not None:
                    texte = contexte.find('TEXTE')
                    if texte is not None:
                        meta_commun = texte.find('META_COMMUN')
                        if meta_commun is not None:
                            id_elem = meta_commun.find('ID')
                            if id_elem is not None:
                                code_id = id_elem.text
                            
                            titre_elem = meta_commun.find('TITRE')
                            if titre_elem is not None:
                                code_name = titre_elem.text
            
            # Si pas trouvé, chercher dans la racine (structure classique)
            if not code_id:
                meta_commun = root.find('.//legi:META_COMMUN', namespaces=self.ns)
                if meta_commun is None:
                    meta_commun = root.find('.//META_COMMUN')
                
                if meta_commun is not None:
                    id_elem = meta_commun.find('legi:ID', namespaces=self.ns)
                    if id_elem is None:
                        id_elem = meta_commun.find('ID')
                    if id_elem is not None:
                        code_id = id_elem.text
                    
                    titre_elem = meta_commun.find('legi:TITRE', namespaces=self.ns)
                    if titre_elem is None:
                        titre_elem = meta_commun.find('TITRE')
                    if titre_elem is not None:
                        code_name = titre_elem.text
            
            # Fallback : extraire code_id depuis le chemin du fichier
            # Le chemin contient souvent LEGITEXT{ID}
            if not code_id and xml_path is not None:
                path_str = str(xml_path)
                import re
                # Chercher LEGITEXT suivi de chiffres dans le chemin
                match = re.search(r'LEGITEXT(\d+)', path_str)
                if match:
                    code_id = f"LEGITEXT{match.group(1)}"
                    # Utiliser le mapping si disponible
                    if code_id in self.CODE_IDS:
                        code_name = self.CODE_IDS[code_id]
            
            # Extraire métadonnées de l'article
            # Essayer plusieurs structures possibles
            
            article_id = None
            article_num = None
            etat = "VIGUEUR"
            date_debut = None
            date_fin = None
            
            # 1. Structure Freemium : META > META_SPEC (métadonnées de l'article)
            meta = article_elem.find('META')
            if meta is not None:
                meta_spec = meta.find('META_SPEC')
                if meta_spec is not None:
                    id_elem = meta_spec.find('ID')
                    if id_elem is not None:
                        article_id = id_elem.text
                    
                    num_elem = meta_spec.find('NUM')
                    if num_elem is not None:
                        article_num = num_elem.text
                    
                    etat_elem = meta_spec.find('ETAT')
                    if etat_elem is not None:
                        etat = etat_elem.text
                    
                    date_debut_elem = meta_spec.find('DATE_DEBUT')
                    if date_debut_elem is not None:
                        date_debut = date_debut_elem.text
                    
                    date_fin_elem = meta_spec.find('DATE_FIN')
                    if date_fin_elem is not None:
                        date_fin = date_fin_elem.text
            
            # 1b. Structure alternative : META > META_ARTICLE (structure classique)
            if not article_id:
                meta_article = article_elem.find('META/META_ARTICLE')
                if meta_article is not None:
                    id_elem = meta_article.find('ID')
                    if id_elem is not None:
                        article_id = id_elem.text
                    
                    num_elem = meta_article.find('NUM')
                    if num_elem is not None:
                        article_num = num_elem.text
                    
                    etat_elem = meta_article.find('ETAT')
                    if etat_elem is not None:
                        etat = etat_elem.text
                    
                    date_debut_elem = meta_article.find('DATE_DEBUT')
                    if date_debut_elem is not None:
                        date_debut = date_debut_elem.text
                    
                    date_fin_elem = meta_article.find('DATE_FIN')
                    if date_fin_elem is not None:
                        date_fin = date_fin_elem.text
            
            # 2. Structure classique : avec namespace
            if not article_id:
                meta_article = article_elem.find('legi:META/legi:META_ARTICLE', namespaces=self.ns)
                if meta_article is None:
                    meta_article = article_elem.find('legi:META/legi:META_SPEC', namespaces=self.ns)
                
                if meta_article is not None:
                    id_elem = meta_article.find('legi:ID', namespaces=self.ns)
                    if id_elem is None:
                        id_elem = meta_article.find('ID')
                    if id_elem is not None:
                        article_id = id_elem.text
                    
                    num_elem = meta_article.find('legi:NUM', namespaces=self.ns)
                    if num_elem is None:
                        num_elem = meta_article.find('NUM')
                    if num_elem is not None:
                        article_num = num_elem.text
                    
                    etat_elem = meta_article.find('legi:ETAT', namespaces=self.ns)
                    if etat_elem is None:
                        etat_elem = meta_article.find('ETAT')
                    if etat_elem is not None:
                        etat = etat_elem.text
                    
                    date_debut_elem = meta_article.find('legi:DATE_DEBUT', namespaces=self.ns)
                    if date_debut_elem is None:
                        date_debut_elem = meta_article.find('DATE_DEBUT')
                    if date_debut_elem is not None:
                        date_debut = date_debut_elem.text
                    
                    date_fin_elem = meta_article.find('legi:DATE_FIN', namespaces=self.ns)
                    if date_fin_elem is None:
                        date_fin_elem = meta_article.find('DATE_FIN')
                    if date_fin_elem is not None:
                        date_fin = date_fin_elem.text
            
            # 3. Structure VERSIONS : chercher dans la version en vigueur
            if not article_id or not article_num or not date_debut:
                versions = article_elem.find('VERSIONS')
                if versions is not None:
                    for version in versions:
                        if version.tag == 'VERSION':
                            meta_version = version.find('META_VERSION')
                            if meta_version is not None:
                                # Vérifier si c'est la version en vigueur
                                etat_version = meta_version.find('ETAT')
                                if etat_version is not None and etat_version.text == 'VIGUEUR':
                                    if not article_id:
                                        id_elem = meta_version.find('ID')
                                        if id_elem is not None:
                                            article_id = id_elem.text
                                    
                                    if not article_num:
                                        # Chercher dans META_VERSION ou dans le BLOC_TEXTUEL de la version
                                        num_elem = meta_version.find('NUM')
                                        if num_elem is not None:
                                            article_num = num_elem.text
                                    
                                    if not date_debut:
                                        date_debut_elem = meta_version.find('DATE_DEBUT')
                                        if date_debut_elem is not None:
                                            date_debut = date_debut_elem.text
                                    
                                    if not date_fin:
                                        date_fin_elem = meta_version.find('DATE_FIN')
                                        if date_fin_elem is not None:
                                            date_fin = date_fin_elem.text
                                    
                                    if not etat or etat == "VIGUEUR":
                                        etat = etat_version.text
                                    break
            
            # 4. Fallback : extraire depuis le nom du fichier si disponible
            # Le nom du fichier est souvent LEGIARTI{ID}.xml
            if not article_id and xml_path is not None:
                filename = xml_path.stem
                if filename.startswith('LEGIARTI'):
                    article_id = filename
            
            # Si toujours pas d'ID, on ne peut pas créer l'article
            if not article_id:
                return None
            
            # Contenu
            content = ""
            # Structure Freemium : BLOC_TEXTUEL > CONTENU (directement sous la racine ARTICLE)
            contenu_elem = article_elem.find('BLOC_TEXTUEL/CONTENU')
            if contenu_elem is None:
                # Structure classique : avec namespace
                contenu_elem = article_elem.find(
                    'legi:BLOC_TEXTUEL/legi:CONTENU',
                    namespaces=self.ns
                )
            
            if contenu_elem is not None:
                # Récupérer tout le texte (y compris les sous-éléments)
                content = ''.join(contenu_elem.itertext()).strip()
            
            # Breadcrumb (structure hiérarchique)
            breadcrumb_parts = []
            if code_name:
                breadcrumb_parts.append(code_name)
            
            # Chercher la structure (LIVRE, TITRE, CHAPITRE, etc.)
            structure = article_elem.getparent()
            while structure is not None and structure.tag != root.tag:
                # Essayer de trouver un titre dans la structure
                titre = structure.find('legi:TITRE', namespaces=self.ns)
                if titre is None:
                    titre = structure.find('TITRE')
                if titre is not None and titre.text:
                    breadcrumb_parts.insert(1, titre.text)
                structure = structure.getparent()
            
            if article_num:
                breadcrumb_parts.append(f"Article {article_num}")
            
            breadcrumb = " > ".join(breadcrumb_parts) if breadcrumb_parts else ""
            
            # Si article_num n'est pas trouvé, essayer de l'extraire depuis l'ID ou le chemin
            if not article_num:
                # Chercher dans le LIEN ou TITRE_TXT
                lien_elem = article_elem.find('.//LIEN')
                if lien_elem is not None:
                    # Le LIEN peut contenir le numéro d'article
                    lien_text = lien_elem.text or ""
                    # Chercher un pattern comme "Article 123" ou "Art. 123"
                    import re
                    match = re.search(r'[Aa]rticle\s+(\d+)', lien_text)
                    if match:
                        article_num = match.group(1)
                
                # Si toujours pas trouvé, utiliser l'ID comme fallback
                if not article_num:
                    article_num = article_id
            
            # Construire l'article (article_id et content sont obligatoires)
            if not article_id or not content:
                return None
            
            return {
                "id": article_id,
                "num": article_num,
                "content": content,
                "code_id": code_id or "UNKNOWN",
                "code_name": code_name or "Code inconnu",
                "etat": etat,
                "date_debut": date_debut,
                "date_fin": date_fin,
                "breadcrumb": breadcrumb,
            }
        
        except Exception as e:
            logger.debug(f"   Erreur extraction article: {e}")
            return None
    
    def ingest_code(
        self,
        code_id: str,
        max_articles: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Ingère un code complet depuis DILA
        
        Args:
            code_id: ID du code
            max_articles: Nombre maximum d'articles (None = tous)
        
        Returns:
            Liste d'articles au format Vertex AI
        """
        logger.info(f"🔍 Ingestion DILA: {code_id}")
        
        # 1. Télécharger
        extract_dir = self.download_code(code_id)
        if not extract_dir:
            return []
        
        # 2. Trouver les fichiers XML
        xml_files = self.find_xml_files(extract_dir)
        if not xml_files:
            logger.warning(f"   ⚠️ Aucun fichier XML trouvé")
            return []
        
        # 3. Parser tous les fichiers
        all_articles = []
        
        for xml_file in xml_files:
            logger.debug(f"   Parsing: {xml_file.name}")
            articles = self.parse_legi_xml(xml_file)
            all_articles.extend(articles)
            
            if max_articles and len(all_articles) >= max_articles:
                all_articles = all_articles[:max_articles]
                break
        
        logger.success(f"   ✅ {len(all_articles)} articles parsés")
        return all_articles


def test_dila_download():
    """Test de téléchargement DILA"""
    client = DILAOpendataClient()
    
    # Tester avec Code Civil
    code_id = "LEGITEXT000006070721"
    articles = client.ingest_code(code_id, max_articles=10)
    
    print(f"\n✅ {len(articles)} articles récupérés")
    if articles:
        print(f"\nPremier article:")
        print(json.dumps(articles[0], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    test_dila_download()

