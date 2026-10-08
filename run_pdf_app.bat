@echo off
setlocal

title PDF Bench
cd /d "%~dp0"

set "APP_PORT=4173"
set "APP_URL=http://127.0.0.1:%APP_PORT%"

rem If PDF Bench is already running, simply open it.
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
    start "" "%APP_URL%"
    exit /b 0
)

where py >nul 2>nul
if not errorlevel 1 goto start_with_py

where python >nul 2>nul
if not errorlevel 1 goto start_with_python

echo.
echo PDF Bench could not start because Python was not found.
echo Install Python from https://www.python.org/downloads/
echo During installation, enable "Add Python to PATH".
echo.
pause
exit /b 1

:open_browser
start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%APP_URL%'"
echo.
echo PDF Bench is running at %APP_URL%
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.
exit /b 0

:start_with_py
call :open_browser
py -m http.server %APP_PORT% --bind 127.0.0.1
goto server_stopped

:start_with_python
call :open_browser
python -m http.server %APP_PORT% --bind 127.0.0.1

:server_stopped
echo.
echo PDF Bench has stopped.
pause
