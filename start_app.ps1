$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$FrontendUrl = "http://127.0.0.1:5500"

if (-not (Test-Path $Python)) {
    Write-Error "Python venv not found at $Python"
}

Write-Host "Starting Bensheimer Fahrdienst..." -ForegroundColor Yellow

$backendCommand = @"
`$env:PYTHONPATH = '$ProjectRoot'
& '$Python' -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
"@

$frontendCommand = @"
Set-Location '$FrontendPath'
& '$Python' -m http.server 5500 --bind 127.0.0.1
"@

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $backendCommand
)

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $frontendCommand
)

Start-Sleep -Seconds 2
Start-Process $FrontendUrl

Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: $FrontendUrl" -ForegroundColor Green
