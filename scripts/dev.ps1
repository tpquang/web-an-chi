# Chạy toàn bộ dự án ở máy Windows: Docker → PostgreSQL → migration → API, web, CMS.
# Dùng: bấm đúp start.cmd, hoặc trong PowerShell: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
# Thêm -Seed để nạp dữ liệu ban đầu (danh mục, nguyên liệu, sản phẩm, hạt, bài viết). Chạy lại nhiều lần được.
# Thêm -Lan để điện thoại, máy khác cùng mạng mở được web và CMS qua IP của máy này.
param([switch]$Seed, [switch]$Lan)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location (Join-Path $PSScriptRoot "..")
# Terminal VS Code hay thiếu System32 và ComSpec; Docker vừa cài có thể chưa có trong PATH
if (-not $env:ComSpec) { $env:ComSpec = Join-Path $env:SystemRoot "System32\cmd.exe" }
$env:Path = (Join-Path $env:SystemRoot "System32") + ";" + $env:SystemRoot + ";" + (Join-Path $env:ProgramFiles "Docker\Docker\resources\bin") + ";" + $env:Path

function Step($text) { Write-Host "`n$text" -ForegroundColor Green }
function Fail($text) { Write-Host "Lỗi: $text" -ForegroundColor Red; Read-Host "Nhấn Enter để đóng"; exit 1 }
function Run($cmd) {
  & $env:ComSpec /c $cmd
  if ($LASTEXITCODE -ne 0) { Fail "Lệnh '$cmd' báo lỗi (mã $LASTEXITCODE)." }
}
# Gọi docker qua cmd. Không gọi thẳng trong PowerShell: với ErrorActionPreference = Stop, PowerShell 5.1 coi
# dòng báo lỗi của docker (lúc Docker chưa bật) là lỗi và dừng cả script trước khi kịp mở Docker Desktop
function Quiet($cmd) {
  & $env:ComSpec /c "$cmd >nul 2>&1"
  return ($LASTEXITCODE -eq 0)
}
function Output($cmd) {
  $out = & $env:ComSpec /c "$cmd 2>nul"
  if ($LASTEXITCODE -ne 0) { return "" }
  return ("$out").Trim()
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

# Database theo DATABASE_URL trong apps/api/.env: cổng 5433 là PostgreSQL trong Docker của dự án,
# cổng khác (VD 5432 của PostgreSQL cài sẵn trên máy) thì không cần Docker
$dbUrl = (Get-Content "apps/api/.env" | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1) -replace "^DATABASE_URL=", ""
$dbPort = if ($dbUrl -match "@[^:/]+:(\d+)/") { [int]$Matches[1] } else { 5432 }
$useDocker = $dbPort -eq 5433

if ($useDocker) {
Step "2/5 Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Không tìm thấy lệnh docker. Cài Docker Desktop ở https://www.docker.com/products/docker-desktop rồi chạy lại." }
if (-not (Quiet "docker info")) {
  $desktop = @((Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"), (Join-Path $env:LOCALAPPDATA "Docker\Docker Desktop.exe")) |
    Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $desktop) { Fail "Docker chưa chạy và không tìm thấy Docker Desktop. Mở Docker Desktop bằng tay rồi chạy lại." }
  Write-Host "Docker đang tắt, đang mở Docker Desktop (lần đầu có thể mất 1-2 phút)..."
  Start-Process $desktop
  $ready = $false
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 2
    if (Quiet "docker info") { $ready = $true; break }
    if ($i % 10 -eq 9) { Write-Host "  vẫn đang chờ Docker..." }
  }
  if (-not $ready) { Fail "Docker chưa lên sau 3 phút. Mở Docker Desktop, chờ báo Engine running rồi chạy lại." }
}
Write-Host "Docker đã chạy"

Step "3/5 PostgreSQL"
Run "docker compose up -d postgres"
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
  $id = Output "docker compose ps -q postgres"
  if ($id -and (Output "docker inspect -f {{.State.Health.Status}} $id") -eq "healthy") { $healthy = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $healthy) { Fail "PostgreSQL chưa sẵn sàng sau 2 phút. Xem log bằng: docker compose logs postgres" }
Write-Host "Database sẵn sàng ở cổng 5433"
} else {
  Step "2-3/5 Database (không dùng Docker)"
  if (-not (Get-NetTCPConnection -LocalPort $dbPort -State Listen -ErrorAction SilentlyContinue)) {
    Fail "apps/api/.env trỏ tới database cổng $dbPort nhưng chưa có gì chạy ở cổng đó. Bật PostgreSQL trên máy, hoặc sửa DATABASE_URL sang cổng 5433 để dùng Docker."
  }
  Write-Host "Dùng PostgreSQL trên máy ở cổng $dbPort (theo apps/api/.env), bỏ qua Docker"
}

Step "4/5 Cập nhật bảng database"
# deploy chỉ áp migration có sẵn, không hỏi gì, không xoá dữ liệu
Run "npm run db:deploy -w @an-chi/api --silent"
if ($Seed) { Run "npm run db:seed" }

Step "5/5 Chạy API, web, CMS (Ctrl+C để dừng)"
# Cổng đã bị chiếm (thường là lần chạy trước chưa tắt) thì báo trước, vì Next và Vite sẽ không lên được
foreach ($port in 3000, 3001, 4000) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "Cổng $port đang bị chiếm, có thể dự án đang chạy ở cửa sổ khác. Đóng cửa sổ đó rồi chạy lại." -ForegroundColor Yellow
  }
}
$hostName = "localhost"
if ($Lan) {
  # IP LAN: card mạng đang có default gateway, bỏ qua địa chỉ tự cấp 169.254
  $ip = Get-NetIPConfiguration -ErrorAction SilentlyContinue | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
    ForEach-Object { $_.IPv4Address.IPAddress } | Where-Object { $_ -notlike "169.254.*" } |
    Sort-Object { if ($_ -match "^(192\.168|10)\.|^172\.(1[6-9]|2\d|3[01])\.") { 0 } else { 1 } } | Select-Object -First 1
  if (-not $ip) { Fail "Không tìm thấy IP mạng LAN. Kiểm tra máy đã kết nối Wi-Fi hoặc dây mạng." }
  $hostName = $ip
  # Biến môi trường ghi đè file .env chỉ trong lần chạy này, file .env giữ nguyên
  $env:LAN_HOST = $ip
  $env:VITE_API_URL = "http://$($ip):4000"
  $env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3001,http://$($ip):3000,http://$($ip):3001"
  $env:NEXT_PUBLIC_SITE_URL = "http://$($ip):3000"
  $rule = Get-NetFirewallRule -DisplayName "An Chi dev LAN" -ErrorAction SilentlyContinue
  if (-not $rule) {
    Write-Host "Windows Firewall có thể chặn máy khác. Mở PowerShell bằng quyền Administrator, chạy một lần:" -ForegroundColor Yellow
    Write-Host '  New-NetFirewallRule -DisplayName "An Chi dev LAN" -Direction Inbound -Protocol TCP -LocalPort 3000,3001,4000 -Profile Private -Action Allow' -ForegroundColor Yellow
    Write-Host "Mạng Wi-Fi cần đặt là Private (Settings > Network > Wi-Fi > Network profile type)." -ForegroundColor Yellow
  }
}
Write-Host "Web  http://$($hostName):3000"
Write-Host "CMS  http://$($hostName):3001"
Write-Host "API  http://$($hostName):4000/health"
& $env:ComSpec /c "npm run dev"
