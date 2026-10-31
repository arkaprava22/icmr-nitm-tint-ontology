$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeRoot = Join-Path $projectRoot '.runtime'
$downloadRoot = Join-Path $runtimeRoot 'downloads'
$version = '6.2.0'
$archiveName = "apache-jena-fuseki-$version.zip"
$archivePath = Join-Path $downloadRoot $archiveName
$checksumPath = "$archivePath.sha512"
$installPath = Join-Path $runtimeRoot "apache-jena-fuseki-$version"
$baseUrl = "https://dlcdn.apache.org/jena/binaries/$archiveName"

if (Test-Path -LiteralPath (Join-Path $installPath 'fuseki-server.jar')) {
    Write-Output "Fuseki $version is already installed in the workspace runtime."
    exit 0
}

New-Item -ItemType Directory -Force -Path $downloadRoot | Out-Null
if (-not (Test-Path -LiteralPath $archivePath)) {
    Invoke-WebRequest -UseBasicParsing -Uri $baseUrl -OutFile $archivePath
}
if (-not (Test-Path -LiteralPath $checksumPath)) {
    Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl.sha512" -OutFile $checksumPath
}

$expected = ((Get-Content -Raw -LiteralPath $checksumPath).Trim() -split '\s+')[0].ToLowerInvariant()
$stream = [System.IO.File]::OpenRead($archivePath)
try {
    $sha512 = [System.Security.Cryptography.SHA512]::Create()
    try {
        $actual = ([System.BitConverter]::ToString($sha512.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
    } finally {
        $sha512.Dispose()
    }
} finally {
    $stream.Dispose()
}
if ($actual -ne $expected) {
    throw "Fuseki archive checksum verification failed."
}

Expand-Archive -LiteralPath $archivePath -DestinationPath $runtimeRoot
if (-not (Test-Path -LiteralPath (Join-Path $installPath 'fuseki-server.jar'))) {
    throw "Fuseki archive did not contain the expected server file."
}

Write-Output "Fuseki $version installed and checksum verified."
