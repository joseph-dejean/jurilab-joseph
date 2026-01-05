# Script pour vérifier les codes disponibles

Write-Host "🔍 Vérification des codes disponibles..." -ForegroundColor Cyan
Write-Host ""

# Chercher les codes LEGITEXT dans le dossier en_vigueur
$vigueurDir = "C:\LEGI\legi\global\code_et_TNC_en_vigueur"

if (Test-Path $vigueurDir) {
    Write-Host "📚 Codes en vigueur trouvés:" -ForegroundColor Green
    Write-Host ""
    
    # Chercher les dossiers LEGITEXT
    $codes = Get-ChildItem $vigueurDir -Recurse -Directory | Where-Object { $_.Name -like "LEGITEXT*" } | Select-Object Name, FullName
    
    if ($codes) {
        Write-Host "   Total: $($codes.Count) codes trouvés" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Codes principaux:" -ForegroundColor Yellow
        
        # Codes qu'on cherche spécifiquement
        $targetCodes = @{
            "LEGITEXT000006070721" = "Code civil"
            "LEGITEXT000006070716" = "Code pénal"
            "LEGITEXT000006072050" = "Code du travail"
            "LEGITEXT000005634379" = "Code de commerce"
            "LEGITEXT000006071164" = "Code de procédure civile"
            "LEGITEXT000006071165" = "Code de procédure pénale"
            "LEGITEXT000006073189" = "Code de la sécurité sociale"
        }
        
        foreach ($code in $codes | Select-Object -First 20) {
            $codeName = $targetCodes[$code.Name]
            if ($codeName) {
                Write-Host "   ✅ $($code.Name) - $codeName" -ForegroundColor Green
            } else {
                Write-Host "   📖 $($code.Name)" -ForegroundColor Cyan
            }
        }
        
        Write-Host ""
        Write-Host "✅ Extraction réussie! Les codes sont disponibles." -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Aucun code LEGITEXT trouvé dans la structure attendue" -ForegroundColor Yellow
        Write-Host "   Cherchant dans toute l'archive..." -ForegroundColor Yellow
        
        $allCodes = Get-ChildItem "C:\LEGI" -Recurse -Directory | Where-Object { $_.Name -like "LEGITEXT*" } | Select-Object -First 10 Name, FullName
        if ($allCodes) {
            Write-Host "   Codes trouvés ailleurs:" -ForegroundColor Green
            $allCodes | ForEach-Object { Write-Host "      - $($_.Name)" }
        }
    }
} else {
    Write-Host "❌ Dossier 'code_et_TNC_en_vigueur' non trouvé" -ForegroundColor Red
}

Write-Host ""

