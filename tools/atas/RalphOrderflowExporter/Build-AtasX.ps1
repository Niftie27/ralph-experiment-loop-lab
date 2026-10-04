$ErrorActionPreference = "Stop"

$atasIndicators = "C:\Program Files\ATAS X\ATAS.Indicators.dll"
$targetFramework = "net10.0-windows"

Write-Host "Preparing RalphOrderflowExporter build for ATAS X..."
Write-Host "ATAS indicators DLL: $atasIndicators"
Write-Host "Target framework: $targetFramework"

if (-not (Test-Path $atasIndicators)) {
    throw "ATAS.Indicators.dll was not found at: $atasIndicators"
}

$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if (-not $dotnet) {
    throw "dotnet SDK was not found. Run 'dotnet --info' and send the output; ATAS has the runtime, but building requires an SDK."
}

$libDir = Join-Path $PSScriptRoot "lib"
New-Item -ItemType Directory -Force -Path $libDir | Out-Null
Copy-Item -Force -Path $atasIndicators -Destination (Join-Path $libDir "ATAS.Indicators.dll")

Write-Host ""
Write-Host "dotnet info:"
dotnet --info

Write-Host ""
Write-Host "Building..."
dotnet build "$PSScriptRoot\RalphOrderflowExporter.csproj" -c Release -f $targetFramework
if ($LASTEXITCODE -ne 0) {
    throw "dotnet build failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Build output:"
$buildOutputDir = "$PSScriptRoot\bin\Release\$targetFramework"
if (-not (Test-Path $buildOutputDir)) {
    throw "Expected build output folder was not created: $buildOutputDir"
}

Get-ChildItem -Path $buildOutputDir -Filter "RalphOrderflowExporter*.dll" -Recurse |
    Select-Object FullName, Length, LastWriteTime |
    Format-Table -AutoSize
