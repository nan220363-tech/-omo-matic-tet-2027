@echo off
cd /d "%~dp0"
echo ===========================================
echo    OMO - VE TET TRAO XUAN
 echo   Mo trinh duyet: http://127.0.0.1:5000
 echo   Nhan Ctrl+C de dong website.
echo ===========================================
where py >nul 2>nul
if %errorlevel% == 0 (
    py app.py
) else (
    python app.py
)
pause
