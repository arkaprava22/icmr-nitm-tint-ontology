$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeRoot = Join-Path $projectRoot '.runtime'
$installPath = Join-Path $runtimeRoot 'apache-jena-fuseki-6.2.0'
$jarPath = Join-Path $installPath 'fuseki-server.jar'
$databasePath = Join-Path $runtimeRoot 'fuseki-data'
$logRoot = Join-Path $runtimeRoot 'logs'
$pidPath = Join-Path $runtimeRoot 'fuseki.pid'
$stdoutPath = Join-Path $logRoot 'fuseki-stdout.log'
$stderrPath = Join-Path $logRoot 'fuseki-stderr.log'

if (-not (Test-Path -LiteralPath $jarPath)) {
    throw 'Fuseki is not installed. Run npm run ontology:setup first.'
}

try {
    $existing = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3030/$/ping' -TimeoutSec 2
    if ($existing.StatusCode -eq 200) {
        Write-Output 'Fuseki is already running at http://127.0.0.1:3030.'
        exit 0
    }
} catch {}

New-Item -ItemType Directory -Force -Path $databasePath, $logRoot | Out-Null
$quotedJarPath = '"{0}"' -f $jarPath
$quotedDatabaseArgument = '--loc="{0}"' -f $databasePath
$arguments = @('-jar', $quotedJarPath, '--port=3030', '--tdb2', $quotedDatabaseArgument, '--update', '--ping', '/tint')
$process = Start-Process -WindowStyle Hidden -FilePath 'java' -ArgumentList $arguments -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
$process.Id | Set-Content -LiteralPath $pidPath

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($process.HasExited) {
        Get-Content -Tail 80 -LiteralPath $stderrPath -ErrorAction SilentlyContinue
        throw "Fuseki stopped during startup with exit code $($process.ExitCode)."
    }
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3030/$/ping' -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Output "Fuseki started at http://127.0.0.1:3030 (PID $($process.Id))."
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 1
}

throw 'Fuseki did not become ready within 30 seconds.'
