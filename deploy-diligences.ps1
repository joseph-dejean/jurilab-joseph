# Script de déploiement complet pour le système de diligences
# Usage: .\deploy-diligences.ps1

Write-Host "🚀 Déploiement du système de diligences Jurilab" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher les messages
function Log-Info {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Vérifier que Firebase CLI est installé
try {
    $null = Get-Command firebase -ErrorAction Stop
    Log-Info "Firebase CLI détecté"
} catch {
    Log-Error "Firebase CLI n'est pas installé"
    Write-Host "Installez-le avec: npm install -g firebase-tools"
    exit 1
}

# Vérifier que npm est installé
try {
    $null = Get-Command npm -ErrorAction Stop
    Log-Info "npm détecté"
} catch {
    Log-Error "npm n'est pas installé"
    exit 1
}

# Étape 1: Build du projet
Write-Host ""
Write-Host "📦 Étape 1/4: Build du projet..." -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Log-Info "Build réussi"
} else {
    Log-Error "Échec du build"
    exit 1
}

# Étape 2: Déploiement des règles Firestore
Write-Host ""
Write-Host "🔐 Étape 2/4: Déploiement des règles Firestore..." -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Log-Info "Règles Firestore déployées"
} else {
    Log-Error "Échec du déploiement des règles"
    exit 1
}

# Étape 3: Déploiement du hosting
Write-Host ""
Write-Host "🌐 Étape 3/4: Déploiement de l'application..." -ForegroundColor Cyan
Write-Host "--------------------------------------------" -ForegroundColor Cyan
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Log-Info "Application déployée"
} else {
    Log-Error "Échec du déploiement de l'application"
    exit 1
}

# Étape 4: Vérification des index Firestore
Write-Host ""
Write-Host "📊 Étape 4/4: Vérification des index..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
Log-Warning "N'oubliez pas de créer les index Firestore si nécessaire:"
Write-Host ""
Write-Host "Index recommandés pour la collection 'diligences':"
Write-Host "  1. lawyerId (Ascending) + clientId (Ascending) + createdAt (Descending)"
Write-Host "  2. lawyerId (Ascending) + createdAt (Descending)"
Write-Host ""
Write-Host "Ces index peuvent être créés automatiquement lors de la première utilisation"
Write-Host "ou manuellement dans la console Firebase:"
Write-Host "https://console.firebase.google.com/project/jurilab-8bc6d/firestore/indexes"

# Résumé final
Write-Host ""
Write-Host "🎉 Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "==================================="
Write-Host ""
Write-Host "Prochaines étapes:"
Write-Host "  1. Testez l'application sur: https://jurilab-8bc6d.web.app"
Write-Host "  2. Vérifiez les index Firestore dans la console"
Write-Host "  3. Créez une diligence de test"
Write-Host "  4. Vérifiez le chronomètre et les statistiques"
Write-Host ""
Log-Info "Le système de diligences est maintenant déployé!"
