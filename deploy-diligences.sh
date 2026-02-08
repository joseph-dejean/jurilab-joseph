#!/bin/bash

# Script de déploiement complet pour le système de diligences
# Usage: ./deploy-diligences.sh

echo "🚀 Déploiement du système de diligences Jurilab"
echo "================================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null
then
    log_error "Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

log_info "Firebase CLI détecté"

# Vérifier que npm est installé
if ! command -v npm &> /dev/null
then
    log_error "npm n'est pas installé"
    exit 1
fi

log_info "npm détecté"

# Étape 1: Build du projet
echo ""
echo "📦 Étape 1/4: Build du projet..."
echo "--------------------------------"
npm run build

if [ $? -eq 0 ]; then
    log_info "Build réussi"
else
    log_error "Échec du build"
    exit 1
fi

# Étape 2: Déploiement des règles Firestore
echo ""
echo "🔐 Étape 2/4: Déploiement des règles Firestore..."
echo "------------------------------------------------"
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    log_info "Règles Firestore déployées"
else
    log_error "Échec du déploiement des règles"
    exit 1
fi

# Étape 3: Déploiement du hosting
echo ""
echo "🌐 Étape 3/4: Déploiement de l'application..."
echo "--------------------------------------------"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    log_info "Application déployée"
else
    log_error "Échec du déploiement de l'application"
    exit 1
fi

# Étape 4: Vérification des index Firestore
echo ""
echo "📊 Étape 4/4: Vérification des index..."
echo "--------------------------------------"
log_warning "N'oubliez pas de créer les index Firestore si nécessaire:"
echo ""
echo "Index recommandés pour la collection 'diligences':"
echo "  1. lawyerId (Ascending) + clientId (Ascending) + createdAt (Descending)"
echo "  2. lawyerId (Ascending) + createdAt (Descending)"
echo ""
echo "Ces index peuvent être créés automatiquement lors de la première utilisation"
echo "ou manuellement dans la console Firebase:"
echo "https://console.firebase.google.com/project/jurilab-8bc6d/firestore/indexes"

# Résumé final
echo ""
echo "🎉 Déploiement terminé avec succès!"
echo "==================================="
echo ""
echo "Prochaines étapes:"
echo "  1. Testez l'application sur: https://jurilab-8bc6d.web.app"
echo "  2. Vérifiez les index Firestore dans la console"
echo "  3. Créez une diligence de test"
echo "  4. Vérifiez le chronomètre et les statistiques"
echo ""
log_info "Le système de diligences est maintenant déployé!"
