[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktop is required for the standalone Windows stack."
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop is installed but its engine is not running."
}

$env:APP_MODE = "development"
$env:PUBLIC_ORIGIN = "http://localhost:3014"
$env:TRUST_PROXY = "false"
$env:ENABLE_REGISTRATION = "true"

$arguments = @("compose", "up", "-d")
if (-not $SkipBuild) { $arguments += "--build" }
& docker @arguments
if ($LASTEXITCODE -ne 0) { throw "The local stack failed to start." }

$ready = $false
for ($attempt = 0; $attempt -lt 90; $attempt++) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3014/api/ready" -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $ready) {
  docker compose logs --tail 100 app
  throw "The application did not become ready at http://localhost:3014."
}

Write-Host "Cofounder Outreach is ready at http://localhost:3014"
if ($OpenBrowser) { Start-Process "http://localhost:3014" }
