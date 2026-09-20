@echo off
rem Records https://hypermole.dev/ as output\hypermole-scroll-1440p60.mp4 (2560x1440, 60 fps).
rem Extra options are passed through, e.g.: record-hypermole.bat --scroll 40
cd /d "%~dp0"
call npm run record -- %*
