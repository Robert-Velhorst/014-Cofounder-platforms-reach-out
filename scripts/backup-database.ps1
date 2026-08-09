[CmdletBinding()]
param(
  [string]$OutputDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) "backups")
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
if (-not $resolvedOutput.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Backups must stay inside this repository workspace."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $resolvedOutput "cofounder-$stamp.sql"
$dump = docker exec 014-cofounder-platforms-reach-out-db-1 mysqldump -ucofounder -pcofounder-local-only --single-transaction --routines --triggers cofounder
if ($LASTEXITCODE -ne 0) { throw "Database backup failed." }
[System.IO.File]::WriteAllLines($target, $dump, [System.Text.UTF8Encoding]::new($false))
Write-Host "Backup written to $target"
