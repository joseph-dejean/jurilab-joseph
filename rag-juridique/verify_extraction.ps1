# Script pour vérifier que l'extraction est complète

Write-Host "🔍 Vérification de l'extraction..." -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier la structure principale
Write-Host "📂 Structure principale:" -ForegroundColor Yellow
$globalDir = "C:\LEGI\legi\global"
if (Test-Path $globalDir) {
    Get-ChildItem $globalDir -Directory | Select-Object Name | Format-Table -AutoSize
} else {
    Write-Host "❌ Dossier global non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Compter les fichiers XML
Write-Host "📄 Fichiers XML:" -ForegroundColor Yellow
$xmlCount = (Get-ChildItem "C:\LEGI" -Recurse -Filter "*.xml" -ErrorAction SilentlyContinue).Count
Write-Host "   Total: $xmlCount fichiers XML" -ForegroundColor Green

Write-Host ""

# 3. Chercher les codes en vigueur
Write-Host "🔍 Codes en vigueur:" -ForegroundColor Yellow
$vigueurDir = "C:\LEGI\legi\global\code_et_TNC_vigueur"
if (Test-Path $vigueurDir) {
    Write-Host "   ✅ Dossier 'code_et_TNC_vigueur' trouvé" -ForegroundColor Green
    
    # Chercher les codes LEGITEXT
    $codes = Get-ChildItem $vigueurDir -Recurse -Directory | Where-Object { $_.Name -like "LEGITEXT*" } | Select-Object -First 10 Name
    if ($codes) {
        Write-Host "   Codes trouvés:" -ForegroundColor Green
        $codes | ForEach-Object { Write-Host "      - $($_.Name)" }
    }
} else {
    Write-Host "   ⚠️ Dossier 'code_et_TNC_vigueur' non trouvé" -ForegroundColor Yellow
    Write-Host "   Cherchant dans toute l'archive..." -ForegroundColor Yellow
    
    $allCodes = Get-ChildItem "C:\LEGI" -Recurse -Directory | Where-Object { $_.Name -like "LEGITEXT*" } | Select-Object -First 10 Name
    if ($allCodes) {
        Write-Host "   Codes trouvés:" -ForegroundColor Green
        $allCodes | ForEach-Object { Write-Host "      - $($_.Name)" }
    }
}

Write-Host ""

# 4. Vérifier les fichiers LEGIARTI (articles)
Write-Host "📚 Articles (LEGIARTI):" -ForegroundColor Yellow
$articles = (Get-ChildItem "C:\LEGI" -Recurse -Filter "*LEGIARTI*.xml" -ErrorAction SilentlyContinue).Count
Write-Host "   Total: $articles fichiers d'articles" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Vérification terminée!" -ForegroundColor Green

