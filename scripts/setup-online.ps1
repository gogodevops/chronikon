# Chronikon online stellen — interaktiv (Windows)
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/setup-online.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Set-EnvFileValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )
  $escaped = $Value -replace '\\', '\\' -replace '"', '\"'
  $lines = Get-Content $Path
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^\s*$Key\s*=") {
      $found = $true
      "$Key=`"$Value`""
    } else {
      $line
    }
  }
  if (-not $found) {
    $out += "$Key=`"$Value`""
  }
  Set-Content -Path $Path -Value $out -Encoding utf8
}

Write-Host ""
Write-Host "  Chronikon - Online-Setup" -ForegroundColor Cyan
Write-Host "  ========================" -ForegroundColor Cyan
Write-Host ""

$envProd = Join-Path $Root ".env.production"
$example = Join-Path $Root ".env.production.example"

if (-not (Test-Path $envProd)) {
  Copy-Item $example $envProd
  $secret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  Set-EnvFileValue -Path $envProd -Key "AUTH_SECRET" -Value $secret
  Write-Host "  .env.production angelegt (AUTH_SECRET generiert)" -ForegroundColor Green
}

# --- Schritt 1: Neon ---
Write-Host ""
Write-Host "  [1/4] Neon PostgreSQL" -ForegroundColor Yellow
Write-Host "  Oeffne https://neon.tech und erstelle Projekt chronikon"
Write-Host "  Connection String kopieren (mit ?sslmode=require)"
Write-Host ""
$db = Read-Host "  DATABASE_URL einfuegen (Enter = ueberspringen)"

if ($db) {
  Set-EnvFileValue -Path $envProd -Key "DATABASE_URL" -Value $db
  Write-Host "  DATABASE_URL gespeichert" -ForegroundColor Green

  Write-Host ""
  Write-Host "  Schema + Admin-Benutzer laden..." -ForegroundColor Gray
  npm run deploy:db
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "  DB bereit - Login: admin@chronikon.dev / Chronikon-Admin-2026!" -ForegroundColor Green
} else {
  Write-Host "  Uebersprungen - spaeter: npm run deploy:db" -ForegroundColor Gray
}

# --- Schritt 2: R2 ---
Write-Host ""
Write-Host "  [2/4] Cloudflare R2" -ForegroundColor Yellow
Write-Host "  Oeffne https://dash.cloudflare.com -> R2 -> Bucket chronikon-attachments"
Write-Host "  API Token erstellen (Read and Write)"
Write-Host ""
$r2Endpoint = Read-Host "  S3_ENDPOINT (https://ACCOUNT_ID.r2.cloudflarestorage.com, Enter = ueberspringen)"
if ($r2Endpoint) {
  $r2Key = Read-Host "  S3_ACCESS_KEY"
  $r2Secret = Read-Host "  S3_SECRET_KEY"
  if ($r2Key -and $r2Secret) {
    Set-EnvFileValue -Path $envProd -Key "S3_ENDPOINT" -Value $r2Endpoint
    Set-EnvFileValue -Path $envProd -Key "S3_ACCESS_KEY" -Value $r2Key
    Set-EnvFileValue -Path $envProd -Key "S3_SECRET_KEY" -Value $r2Secret
    Set-EnvFileValue -Path $envProd -Key "STORAGE_MODE" -Value "s3"
    Write-Host "  R2 gespeichert" -ForegroundColor Green
  } else {
    Write-Host "  R2 unvollstaendig - uebersprungen" -ForegroundColor Gray
  }
} else {
  Write-Host "  R2 uebersprungen - Uploads erst nach R2-Setup" -ForegroundColor Gray
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
Write-Host "  GitHub (vor Vercel):" -ForegroundColor Yellow
Write-Host "  1. https://github.com/new -> Repo 'chronikon' anlegen"
Write-Host "  2. git remote add origin https://github.com/DEIN-GITHUB-USER/chronikon.git"
Write-Host "  3. git branch -M main && git push -u origin main"
Write-Host "  (DEIN-GITHUB-USER durch echten Namen ersetzen - nicht DEIN-NAME!)"
Write-Host ""
Write-Host "  2. Environment Variables aus .env.production eintragen"
Write-Host "  3. Deploy -> AUTH_URL auf die echte URL setzen -> Redeploy"
Write-Host ""
$open = Read-Host "  Vercel im Browser oeffnen? (j/n)"
if ($open -eq "j") { Start-Process "https://vercel.com/new" }

Write-Host ""
Write-Host "  Fertig vorbereitet!" -ForegroundColor Green
Write-Host "  Nach Deploy: https://DEINE-URL.vercel.app/api/health" -ForegroundColor Gray
Write-Host ""
