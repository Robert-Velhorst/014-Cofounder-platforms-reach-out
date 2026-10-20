[CmdletBinding()]
param(
  [string]$Container,
  [string]$Database,
  [string]$User,
  [string]$KeyFile,
  [string]$OutputFile,
  [switch]$MaintenanceConfirmed
)

$ErrorActionPreference = "Stop"
if (-not $Container -or -not $Database -or -not $User -or -not $KeyFile -or
    -not $OutputFile -or -not $MaintenanceConfirmed) {
  [Console]::Error.WriteLine('{"level":"fatal","event":"recovery_failed","code":"recovery_configuration_invalid"}')
  exit 1
}
# Credentials come only from RECOVERY_DB_PASSWORD in the operator environment.
# The Node runner owns byte-safe dumping, encryption and exclusive publication.
& node (Join-Path $PSScriptRoot "database-recovery.mjs") backup `
  --container $Container --database $Database --user $User `
  --key-file $KeyFile --file $OutputFile --maintenance-confirmed
exit $LASTEXITCODE
