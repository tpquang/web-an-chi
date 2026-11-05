# Chạy toàn bộ dự án ở máy Windows: Docker → PostgreSQL → migration → API, web, CMS.
# Dùng: bấm đúp start.cmd, hoặc trong PowerShell: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
# Thêm -Seed để nạp dữ liệu mẫu (sản phẩm, bài viết, hạt vòng tay). Chạy lại nhiều lần được.
param([switch]$Seed)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location (Join-Path $PSScriptRoot "..")

function Step($text) { Write-Host "`n$text" -ForegroundColor Green }
function Fail($text) { Write-Host "Lỗi: $text" -ForegroundColor Red; Read-Host "Nhấn Enter để đóng"; exit 1 }
function Run($cmd) {
  & $env:ComSpec /c $cmd
  if ($LASTEXITCODE -ne 0) { Fail "Lệnh '$cmd' báo lỗi (mã $LASTEXITCODE)." }
}

Step "1/5 Kiểm tra cài đặt"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Chưa cài Node.js 22. Tải ở https://nodejs.org rồi chạy lại." }
if (-not (Test-Path node_modules)) { Run "npm install" }
foreach ($app in "api", "web", "cms") {
  if (-not (Test-Path "apps/$app/.env")) {
    Copy-Item "apps/$app/.env.example" "apps/$app/.env"
    Write-Host "Đã tạo apps/$app/.env từ file mẫu"
  }
}
# Ổ ExFAT từng cắm vào máy Mac có file ._*, xoá để Prisma và Next không đọc nhầm
Get-ChildItem apps -Recurse -Force -Filter "._*" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch "node_modules" } | Remove-Item -Force -ErrorAction SilentlyContinue

Step "2/5 Docker"
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  $desktop = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path $desktop)) { Fail "Chưa cài Docker Desktop. Tải ở https://www.docker.com/products/docker-desktop rồi chạy lại." }
  Write-Host "Docker đang tắt, đang mở Docker Desktop..."
  Start-Process $desktop
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 2
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { break }
  }
  if ($LASTEXITCODE -ne 0) { Fail "Docker chưa lên sau 3 phút. Mở Docker Desktop bằng tay rồi chạy lại." }
}
Write-Host "Docker đã chạy"

Step "3/5 PostgreSQL"
Run "docker compose up -d postgres"
for ($i = 0; $i -lt 60; $i++) {
  $id = (docker compose ps -q postgres)
  if ((docker inspect -f "{{.State.Health.Status}}" $id 2>$null) -eq "healthy") { break }
  Start-Sleep -Seconds 2
}
Write-Host "Database sẵn sàng ở cổng 5433"

Step "4/5 Cập nhật bảng database"
# deploy chỉ áp migration có sẵn, không hỏi gì, không xoá dữ liệu
Run "npm run db:deploy -w @an-chi/api --silent"
if ($Seed) { Run "npm run db:seed" }

Step "5/5 Chạy API, web, CMS (Ctrl+C để dừng)"
Write-Host "Web  http://localhost:3000"
Write-Host "CMS  http://localhost:3001"
Write-Host "API  http://localhost:4000/health"
& $env:ComSpec /c "npm run dev"
