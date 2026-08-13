@echo off
setlocal
set "TARGET=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\WIP-EV-Kiosk.bat"
if exist "%TARGET%" del /q "%TARGET%"
echo WIP kiosk autostart removed.
pause
