@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto failed
)
call npm run build
if errorlevel 1 goto failed
echo.
echo Open http://127.0.0.1:3001 in your browser.
echo Keep this window open while using the Hub. Press Ctrl+C to stop.
call npm start
goto :eof
:failed
echo The Hub could not start. Check the message above.
pause
exit /b 1
