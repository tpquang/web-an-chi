#!/usr/bin/env bash
# Chạy toàn bộ dự án khi dev: Docker → PostgreSQL → cập nhật bảng → API, web, CMS.
# Dùng: npm start, hoặc bấm đúp start.command trong Finder.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m%s\033[0m\n' "$1"; }

step "1/4 Kiểm tra cài đặt"
[ -d node_modules ] || npm install
for app in api web cms; do
  [ -f "apps/$app/.env" ] || { cp "apps/$app/.env.example" "apps/$app/.env"; echo "Đã tạo apps/$app/.env từ file mẫu"; }
done
# macOS sinh file ._* trên ổ ExFAT, xoá để Prisma và Next không đọc nhầm
find apps -name '._*' -not -path '*/node_modules/*' -delete 2>/dev/null || true

step "2/4 Docker"
if ! docker info >/dev/null 2>&1; then
  echo "Docker đang tắt, đang mở Docker Desktop..."
  open -a Docker
  for i in $(seq 1 90); do docker info >/dev/null 2>&1 && break; sleep 2; done
  docker info >/dev/null 2>&1 || { echo "Docker chưa lên sau 3 phút. Mở Docker Desktop bằng tay rồi chạy lại."; exit 1; }
fi
echo "Docker đã chạy"

step "3/4 PostgreSQL"
docker compose up -d postgres
for i in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q postgres)" 2>/dev/null)" = healthy ] && break
  sleep 2
done
echo "Database sẵn sàng ở cổng 5433"
# deploy chỉ áp migration có sẵn, không hỏi gì, không xoá dữ liệu
npm run db:deploy -w @an-chi/api --silent

step "4/4 Chạy API, web, CMS (Ctrl+C để dừng)"
echo "Web  http://localhost:3000"
echo "CMS  http://localhost:3001"
echo "API  http://localhost:4000/health"
exec npm run dev
