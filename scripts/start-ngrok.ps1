[CmdletBinding()]
param(
  [ValidatePattern("^https://[A-Za-z0-9.-]+$")]
  [string]$Url
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
  throw "ngrok v3 is required. Install it and configure your authtoken first."
}
if (-not $env:JWT_SECRET -or $env:JWT_SECRET.Length -lt 32 -or $env:JWT_SECRET -like "local-compose-*") {
  throw "Set JWT_SECRET to a unique value of at least 32 characters before publishing the app."
}

try {
  $localReady = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3014/api/ready" -TimeoutSec 3
} catch {
  & "$PSScriptRoot\start-windows.ps1" -SkipBuild
  $localReady = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3014/api/ready" -TimeoutSec 3
}
if ($localReady.StatusCode -ne 200) { throw "The local application is not ready." }

$ngrokArguments = @("http", "3014")
if ($Url) { $ngrokArguments += "--url=$Url" }
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList $ngrokArguments -WindowStyle Hidden -PassThru

try {
  $publicUrl = $null
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    try {
      $agent = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/endpoints" -TimeoutSec 2
      $httpsEndpoint = $agent.endpoints | Where-Object { $_.url -like "https://*" } | Select-Object -First 1
      if ($httpsEndpoint) {
        $publicUrl = $httpsEndpoint.url.TrimEnd("/")
        break
      }
    } catch {
      # The local agent API is not ready yet.
    }
  }
  if (-not $publicUrl) { throw "ngrok did not publish an HTTPS endpoint." }
  if ($Url -and $publicUrl -ne $Url.TrimEnd("/")) {
    throw "ngrok published an unexpected URL."
  }

  $env:APP_MODE = "production"
  $env:PUBLIC_ORIGIN = $publicUrl
  $env:TRUST_PROXY = "true"
  $env:ENABLE_REGISTRATION = "false"
  docker compose up -d --force-recreate app
  if ($LASTEXITCODE -ne 0) { throw "The app could not restart in hosted mode." }

  $verified = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 2
    try {
      $health = Invoke-WebRequest -UseBasicParsing -Uri "$publicUrl/api/health" -TimeoutSec 5
      if ($health.StatusCode -eq 200) {
        $verified = $true
        break
      }
    } catch {
      # Continue until the bounded readiness window expires.
    }
  }
  if (-not $verified) { throw "The public health check failed." }

  [pscustomobject]@{
    publicUrl = $publicUrl
    ngrokProcessId = $ngrokProcess.Id
    registrationEnabled = $false
    verified = $true
  } | ConvertTo-Json
} catch {
  if ($ngrokProcess -and -not $ngrokProcess.HasExited) {
    Stop-Process -Id $ngrokProcess.Id -Force
  }
  $env:APP_MODE = "development"
  $env:PUBLIC_ORIGIN = "http://localhost:3014"
  $env:TRUST_PROXY = "false"
  $env:ENABLE_REGISTRATION = "true"
  docker compose up -d --force-recreate app *> $null
  throw
}
