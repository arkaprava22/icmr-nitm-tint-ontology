$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$pidPath = Join-Path $projectRoot '.runtime\fuseki.pid'
if (-not (Test-Path -LiteralPath $pidPath)) {
    Write-Output 'No workspace Fuseki process is recorded.'
    exit 0
}

$processId = [int](Get-Content -Raw -LiteralPath $pidPath)
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $processId
    $process.WaitForExit(5000)
}
Remove-Item -LiteralPath $pidPath -Force
Write-Output 'Workspace Fuseki process stopped.'
