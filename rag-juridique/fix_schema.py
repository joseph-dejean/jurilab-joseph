"""
Script pour activer les filtres dans le schéma Vertex AI Search via l'API

Ce script contourne le bug d'affichage de l'interface et active directement
les filtres via l'API Discovery Engine.
"""

import os
import json
from google.api_core.client_options import ClientOptions
# Essayer v1beta d'abord (pour SchemaServiceClient)
try:
    from google.cloud import discoveryengine_v1beta as discoveryengine
except ImportError:
    # Fallback sur v1 si v1beta n'est pas disponible
    from google.cloud import discoveryengine_v1 as discoveryengine
from dotenv import load_dotenv

from config.settings import get_settings

load_dotenv()
settings = get_settings()


def fix_my_schema():
    """Active les filtres pour les champs du schéma"""
    
    project_id = settings.GCP_PROJECT_ID
    data_store_id = settings.GCP_DATASTORE_ID
    location = settings.GCP_LOCATION or "global"
    
    if not project_id or not data_store_id:
        print("❌ GCP_PROJECT_ID et GCP_DATASTORE_ID doivent être définis dans .env")
        return
    
    # Pour les datastores structurés, on peut avoir besoin du project number au lieu du project ID
    # L'API peut utiliser le project number (901560039828) au lieu du project ID (jurilab-481600)
    # On va essayer les deux si nécessaire
    
    print(f"🔧 Configuration du schéma pour le datastore: {data_store_id}")
    print(f"   Project ID: {project_id}")
    print(f"   Location: {location}")
    print()
    
    # Initialiser le client
    client_options = ClientOptions(
        api_endpoint=f"{location}-discoveryengine.googleapis.com"
        if location != "global"
        else "discoveryengine.googleapis.com"
    )
    
    client = discoveryengine.SchemaServiceClient(client_options=client_options)
    
    # Chemin complet du schéma
    name = f"projects/{project_id}/locations/{location}/collections/default_collection/dataStores/{data_store_id}/schemas/default"
    
    print(f"📋 Chemin du schéma: {name}")
    print()
    
    # Définition du schéma avec TOUS les champs et filtres activés
    # Important : Inclure TOUS les champs existants pour ne pas les perdre
    schema_dict = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            # Champ ID (clé primaire)
            "id": {
                "type": "string",
                "keyProperty": True,
                "indexable": True,
                "retrievable": True
            },
            # Champ content (pour embeddings)
            "content": {
                "type": "string",
                "indexable": True,
                "retrievable": True
            },
            # Champ title
            "title": {
                "type": "string",
                "indexable": True,
                "retrievable": True
            },
            # Métadonnées avec filtres activés
            "code_id": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "code_name": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "type": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "nature": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "article_id": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "article_num": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "breadcrumb": {
                "type": "string",
                "indexable": True,
                "retrievable": True
            },
            "etat": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "date_debut": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "date_fin": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "source": {
                "type": "string",
                "filterable": True,
                "indexable": True,
                "retrievable": True
            },
            "ingestion_date": {
                "type": "string",
                "indexable": True,
                "retrievable": True
            }
        }
    }
    
    # Créer l'objet Schema
    schema = discoveryengine.Schema(
        name=name,
        struct_schema=schema_dict
    )
    
    print("📝 Configuration du schéma...")
    print("   Champs avec filtres activés:")
    print("   - code_id, code_name, type, nature")
    print("   - article_id, article_num")
    print("   - etat, date_debut, date_fin, source")
    print()
    print("⚠️  Cela va déclencher une réindexation (peut prendre quelques heures)")
    print()
    
    try:
        # Essayer d'abord de récupérer le schéma existant
        try:
            existing_schema = client.get_schema(request={"name": name})
            print("✅ Schéma existant trouvé, mise à jour...")
            # Mettre à jour le schéma existant
            operation = client.update_schema(request={"schema": schema})
        except Exception as get_error:
            error_str = str(get_error).lower()
            if "not found" in error_str or "404" in error_str:
                print("ℹ️  Schéma n'existe pas encore, création...")
                # Créer le schéma
                parent = f"projects/{project_id}/locations/{location}/collections/default_collection/dataStores/{data_store_id}"
                print(f"   Parent: {parent}")
                operation = client.create_schema(
                    request={
                        "parent": parent,
                        "schema": schema,
                        "schema_id": "default"
                    }
                )
            else:
                print(f"⚠️  Erreur lors de la récupération: {get_error}")
                raise
        
        print("✅ Opération lancée...")
        print("   En attente de la réindexation...")
        
        # Attendre le résultat
        result = operation.result(timeout=300)  # 5 minutes max
        
        print()
        print("=" * 70)
        print("✅ SUCCÈS ! Le schéma est mis à jour")
        print("=" * 70)
        print()
        print("📋 Prochaines étapes:")
        print("   1. Attendre la réindexation (quelques heures)")
        print("   2. Rafraîchir la page Schéma dans GCP Console")
        print("   3. Vérifier que les coches 'Filtrable' apparaissent")
        print("   4. Tester les filtres avec test_search.py")
        print()
        
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ ERREUR lors de la mise à jour du schéma")
        print("=" * 70)
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print()
        import traceback
        print("Traceback complet:")
        print(traceback.format_exc())
        print()
        print("💡 Vérifications:")
        print("   - Les credentials GCP sont-ils configurés ?")
        print("   - Le datastore existe-t-il ?")
        print("   - La bibliothèque google-cloud-discoveryengine est-elle installée ?")


if __name__ == "__main__":
    fix_my_schema()

