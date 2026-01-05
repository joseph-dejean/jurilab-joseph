# Script pour surveiller les logs en temps réel
Write-Host "=== SURVEILLANCE DES LOGS API ===" -ForegroundColor Green
Write-Host "Appuyez sur CTRL+C pour arrêter" -ForegroundColor Yellow
Write-Host ""

$logFile = "c:\Users\sofia\.cursor\projects\c-Users-sofia-Desktop-perso-rag-juridique\terminals\10.txt"

if (Test-Path $logFile) {
    Get-Content $logFile -Wait -Tail 50
} else {
    Write-Host "❌ Fichier de log introuvable : $logFile" -ForegroundColor Red
    Write-Host "Le backend est-il lancé ?" -ForegroundColor Yellow
}

