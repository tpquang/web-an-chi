@echo off
rem Bấm đúp để chạy dự án trên Windows. Lần đầu nên chạy: start.cmd seed
rem Gọi bằng đường dẫn đầy đủ vì có máy PATH thiếu System32 (hay gặp trong terminal VS Code)
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"
"%SystemRoot%\System32\chcp.com" 65001 >nul
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if /i "%~1"=="seed" (
  "%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1" -Seed
) else (
  "%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1"
)
pause
