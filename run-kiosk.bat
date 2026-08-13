@echo off
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
if not exist node_modules (
  echo Installing Electron for the first run...
  call npm install
)
call npm run kiosk
