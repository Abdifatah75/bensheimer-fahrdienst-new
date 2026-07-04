@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
set "POWERSHELL_SCRIPT=%PROJECT_ROOT%start_app.ps1"

if not exist "%POWERSHELL_SCRIPT%" (
    echo start_app.ps1 was not found in:
    echo %PROJECT_ROOT%
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%POWERSHELL_SCRIPT%"

endlocal
