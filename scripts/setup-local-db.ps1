# Legt User + DB "chronikon" an (PostgreSQL lokal, ohne Docker)
param(
  [string]$PostgresUser = "postgres",
  [string]$PostgresPassword = "",
  [int]$Port = 5432
)

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$sql = Join-Path $PSScriptRoot "init-local-db.sql"

if (-not (Test-Path $psql)) {
  $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $psql = $found.FullName } else { throw "psql nicht gefunden. PostgreSQL installiert?" }
}

if (-not $PostgresPassword) {
  $secure = Read-Host "Passwort für PostgreSQL-User '$PostgresUser'" -AsSecureString
  $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$env:PGPASSWORD = $PostgresPassword
& $psql -U $PostgresUser -h localhost -p $Port -d postgres -f $sql
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Fertig. DATABASE_URL in .env:"
Write-Host 'DATABASE_URL="postgresql://chronikon:chronikon@localhost:5432/chronikon?schema=public"'
