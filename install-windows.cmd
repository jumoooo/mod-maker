:; echo "This file is for Windows. On Mac / Linux / WSL run:  sh install-mac-linux.sh  (nothing was changed)"; exit 3 #
@echo off
rem mod-maker installer for Windows. On Mac / Linux / WSL run:  sh install-mac-linux.sh
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0mod-maker\scripts\install.ps1"
echo.
pause
