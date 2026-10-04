$ErrorActionPreference = "Stop"

$roots = @(
    "$env:LOCALAPPDATA\Programs",
    "$env:LOCALAPPDATA",
    "$env:APPDATA",
    "$env:ProgramFiles",
    ${env:ProgramFiles(x86)}
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

Write-Host "Searching ATAS runtime/config files..."
$runtimeFiles = foreach ($root in $roots) {
    Get-ChildItem -Path $root -Filter "OFT.Platform*.runtimeconfig.json" -Recurse -ErrorAction SilentlyContinue
}

$dllFiles = foreach ($root in $roots) {
    Get-ChildItem -Path $root -Filter "ATAS.Indicators.dll" -Recurse -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Runtime config candidates:"
$runtimeFiles | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize

Write-Host ""
Write-Host "ATAS.Indicators.dll candidates:"
$dllFiles | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize

Write-Host ""
Write-Host "Runtime framework summary:"
$frameworkSummary = foreach ($file in $runtimeFiles) {
    try {
        $json = Get-Content -Raw -Path $file.FullName | ConvertFrom-Json
        $frameworks = @()
        if ($json.runtimeOptions.framework) { $frameworks += $json.runtimeOptions.framework }
        if ($json.runtimeOptions.frameworks) { $frameworks += $json.runtimeOptions.frameworks }

        foreach ($framework in $frameworks) {
            [PSCustomObject]@{
                RuntimeConfig = $file.FullName
                Framework = $framework.name
                Version = $framework.version
            }
        }
    }
    catch {
        [PSCustomObject]@{
            RuntimeConfig = $file.FullName
            Framework = "parse-error"
            Version = $_.Exception.Message
        }
    }
}
$frameworkSummary | Format-Table -AutoSize

Write-Host ""
Write-Host "Next:"
Write-Host "1. Send the RuntimeConfig framework/version line."
Write-Host "2. Copy one ATAS.Indicators.dll path, or copy the DLL into .\lib\ATAS.Indicators.dll before building."
