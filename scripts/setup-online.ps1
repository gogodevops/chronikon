# Chronikon online stellen — interaktiv (Windows)
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/setup-online.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "  Chronikon — Online-Setup" -ForegroundColor Cyan
Write-Host "  ========================" -ForegroundColor Cyan
Write-Host ""

$envProd = Join-Path $Root ".env.production"
$example = Join-Path $Root ".env.production.example"

if (-not (Test-Path $envProd)) {
  Copy-Item $example $envProd
  $secret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  (Get-Content $envProd) -replace 'DEIN_LANGES_SECRET', $secret | Set-Content $envProd
  Write-Host "  .env.production angelegt (AUTH_SECRET generiert)" -ForegroundColor Green
}

# --- Schritt 1: Neon ---
Write-Host ""
Write-Host "  [1/4] Neon PostgreSQL" -ForegroundColor Yellow
Write-Host "  Oeffne https://neon.tech und erstelle Projekt 'chronikon'"
Write-Host "  Connection String kopieren (mit ?sslmode=require)"
Write-Host ""
$db = Read-Host "  DATABASE_URL einfuegen (Enter = ueberspringen wenn schon in .env.production)"

if ($db) {
  $content = Get-Content $envProd -Raw
  $content = $content -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$db`""
  $content = $content -replace 'DATABASE_URL="PASTE_NEON_CONNECTION_STRING_HERE"', "DATABASE_URL=`"$db`""
  Set-Content $envProd $content.TrimEnd()
  Write-Host "  DATABASE_URL gespeichert" -ForegroundColor Green

  Write-Host ""
  Write-Host "  Schema + Demo-Daten laden..." -ForegroundColor Gray
  npm run deploy:db
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "  DB bereit — Login: max@chronikon.dev / demo123" -ForegroundColor Green
} else {
  Write-Host "  Uebersprungen — spaeter: npm run deploy:db" -ForegroundColor Gray
}

# --- Schritt 2: R2 ---
Write-Host ""
Write-Host "  [2/4] Cloudflare R2" -ForegroundColor Yellow
Write-Host "  Oeffne https://dash.cloudflare.com → R2 → Bucket 'chronikon-attachments'"
Write-Host "  API Token erstellen (Read & Write)"
Write-Host ""
$r2Endpoint = Read-Host "  S3_ENDPOINT (https://ACCOUNT_ID.r2.cloudflarestorage.com)"
$r2Key = Read-Host "  S3_ACCESS_KEY"
$r2Secret = Read-Host "  S3_SECRET_KEY" -AsSecureString
$r2SecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($r2Secret)
)

if ($r2Endpoint -and $r2Key -and $r2SecretPlain) {
  $content = Get-Content $envProd -Raw
  $content = $content -replace 'S3_ENDPOINT="[^"]*"', "S3_ENDPOINT=`"$r2Endpoint`""
  $content = $content -replace 'S3_ACCESS_KEY="[^"]*"', "S3_ACCESS_KEY=`"$r2Key`""
  $content = $content -replace 'S3_SECRET_KEY="[^"]*"', "S3_SECRET_KEY=`"$r2SecretPlain`""
  Set-Content $envProd $content.TrimEnd()
  Write-Host "  R2 gespeichert" -ForegroundColor Green
} else {
  Write-Host "  R2 uebersprungen — Uploads funktionieren erst nach R2-Setup" -ForegroundColor Gray
}

# --- Schritt 3: Env Check ---
Write-Host ""
Write-Host "  [3/4] Konfiguration pruefen..." -ForegroundColor Yellow
npm run deploy:check
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "  Bitte .env.production vervollstaendigen und erneut ausfuehren." -ForegroundColor Red
  exit 1
}

# --- Schritt 4: Vercel ---
Write-Host ""
Write-Host "  [4/4] Vercel Deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Variablen fuer Vercel (kopieren):" -ForegroundColor Cyan
Get-Content $envProd | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
Write-Host ""
Write-Host "  1. https://vercel.com/new → GitHub Repo importieren"
Write-Host "  2. Environment Variables aus .env.production eintragen"
Write-Host "  3. Deploy → AUTH_URL auf die echte URL setzen → Redeploy"
Write-Host ""
$open = Read-Host "  Vercel im Browser oeffnen? (j/n)"
if ($open -eq "j") { Start-Process "https://vercel.com/new" }

Write-Host ""
Write-Host "  Fertig vorbereitet!" -ForegroundColor Green
Write-Host "  Nach Deploy: https://DEINE-URL.vercel.app/api/health" -ForegroundColor Gray
Write-Host ""
