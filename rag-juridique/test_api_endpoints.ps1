# Script de diagnostic des endpoints API
$baseUrl = "http://localhost:8000"

Write-Host "=== DIAGNOSTIC API LEGAL-RAG ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Test Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health Check OK" -ForegroundColor Green
        Write-Host $response.Content
    }
} catch {
    Write-Host "❌ Health Check FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 2: Act Types
Write-Host "2️⃣ Test Machine à Actes (Types)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/machine-actes/types" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Machine à Actes OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Machine à Actes FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# Test 3: Super-Chercheur
Write-Host "3️⃣ Test Super-Chercheur..." -ForegroundColor Cyan
try {
    $body = @{
        query = "article 1101"
        max_results = 5
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/search" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Super-Chercheur OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Super-Chercheur FAILED" -ForegroundColor Red
    Write-Host "Statut: $($_.Exception.Response.StatusCode.value__)"
    Write-Host $_.Exception.Message
    
    # Essayer de lire le corps de l'erreur
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Détails: $errorBody" -ForegroundColor Yellow
    } catch {}
}
Write-Host ""

# Test 4: Chatbot
Write-Host "4️⃣ Test Chatbot..." -ForegroundColor Cyan
try {
    $body = @{
        message = "Bonjour"
        conversation_id = "test_diagnostic"
        use_rag = $true
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/chat" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Chatbot OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Chatbot FAILED" -ForegroundColor Red
    Write-Host "Statut: $($_.Exception.Response.StatusCode.value__)"
    
    # Essayer de lire le corps de l'erreur
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Détails: $errorBody" -ForegroundColor Yellow
    } catch {}
}
Write-Host ""

Write-Host "=== FIN DU DIAGNOSTIC ===" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Pour plus de détails, consultez : http://localhost:8000/docs" -ForegroundColor Cyan

