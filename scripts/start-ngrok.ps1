[CmdletBinding()]
param(
  [ValidatePattern("^https://[A-Za-z0-9.-]+$")]
  [string]$Url,
  [switch]$PublishConfirmed
)

$ErrorActionPreference = "Stop"
$arguments = @((Join-Path $PSScriptRoot "start-ngrok.mjs"))
if ($Url) { $arguments += @("--url", $Url) }
if ($PublishConfirmed) { $arguments += "--publish-confirmed" }
& node @arguments
exit $LASTEXITCODE
