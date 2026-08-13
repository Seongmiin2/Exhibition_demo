@echo off
setlocal
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%STARTUP%\WIP-EV-Kiosk.bat"
(
  echo @echo off
  echo call "%~dp0run-kiosk.bat"
) > "%TARGET%"
echo WIP kiosk autostart installed:
echo %TARGET%
pause
