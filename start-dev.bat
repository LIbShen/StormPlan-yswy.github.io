@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "SERVER_URL=http://localhost:3000/"
set "SERVER_READY=0"
set "NODE_BIN="

if exist "D:\Node.js\node\node.exe" (
  set "NODE_BIN=D:\Node.js\node"
) else if exist "D:\Node.js\node.exe" (
  set "NODE_BIN=D:\Node.js"
) else if exist "C:\Program Files\nodejs\node.exe" (
  set "NODE_BIN=C:\Program Files\nodejs"
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
  set "NODE_BIN=C:\Program Files (x86)\nodejs"
)

if defined NODE_BIN (
  set "PATH=!NODE_BIN!;%PATH%"
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  echo Please install Node.js or add it to PATH, then run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found in PATH.
  echo Please ensure Node.js is installed correctly, then run this file again.
  echo.
  pause
  exit /b 1
)

call :isServerReady
if "!SERVER_READY!"=="1" (
  echo Detected an existing server on !SERVER_URL!
  echo Opening browser...
  start "" "!SERVER_URL!"
  exit /b 0
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Starting dev server...
start "" cmd /k "npm run dev"

call :waitServerReady 45
if "!SERVER_READY!"=="1" (
  start "" "!SERVER_URL!"
) else (
  echo.
  echo The dev server did not become ready within 45 seconds.
  echo Please check the server window for errors, then refresh the browser.
  echo.
  pause
)

echo.
echo Dev server is starting. To stop it, close the server window or press Ctrl+C there.
endlocal
exit /b 0

:isServerReady
set "SERVER_READY=0"
for /f %%r in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' -UseBasicParsing -TimeoutSec 2; if ($r -and $r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { '1' } else { '0' } } catch { '0' }"') do set "SERVER_READY=%%r"
exit /b 0

:waitServerReady
set "MAX_WAIT=%~1"
set "SERVER_READY=0"
for /l %%i in (1,1,%MAX_WAIT%) do (
  call :isServerReady
  if "!SERVER_READY!"=="1" exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 0
