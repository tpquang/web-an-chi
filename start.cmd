@echo off
rem Bấm đúp để chạy dự án trên Windows. Lần đầu nên chạy start.cmd seed để có dữ liệu mẫu.
chcp 65001 >nul
if /i "%~1"=="seed" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1" -Seed
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev.ps1"
)
pause
