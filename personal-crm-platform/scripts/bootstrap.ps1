$ErrorActionPreference = "Stop"
$RootDir = (Resolve-Path "$PSScriptRoot\..\..").Path

if (-not (Test-Path "$RootDir\personal-crm-platform\.env")) {
  Copy-Item "$RootDir\personal-crm-platform\.env.example" "$RootDir\personal-crm-platform\.env"
}

Push-Location "$RootDir\personal-crm-api"
npm install
$env:DATABASE_URL = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://postgres:postgres@localhost:5432/personal_crm" }
npm run prisma:generate
Pop-Location

Push-Location "$RootDir\personal-crm-agents"
npm install
npm run prisma:generate
Pop-Location

Push-Location "$RootDir\personal-crm-clients"
npm install
Pop-Location

Write-Host "Bootstrap complete. Run: cd personal-crm-platform; docker compose up --build"

