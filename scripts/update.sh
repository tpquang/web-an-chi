#!/usr/bin/env bash
# Cập nhật code mới và build lại: sudo bash scripts/update.sh
# Cần chạy scripts/deploy.sh một lần trước đó trên VPS này (nó tạo .env, database, nginx, HTTPS).
#
# Biến tuỳ chọn:
#   SEED=1      nạp lại dữ liệu mẫu (sản phẩm, bài viết, hạt vòng tay). Ghi đè dữ liệu mẫu cùng mã.
#   NO_PULL=1   không git pull, build đúng code đang có trong thư mục
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mLỗi: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Hãy chạy bằng sudo: sudo bash scripts/update.sh"
cd "$APP_DIR"
[ -f .deploy.env ] || die "Chưa có .deploy.env. Chạy sudo bash scripts/deploy.sh trước."
# shellcheck disable=SC1091
. ./.deploy.env

if [ "${NO_PULL:-0}" != "1" ]; then
  log "Tải code mới (git pull)"
  # Script chạy bằng sudo nhưng repo thuộc user khác
  git config --global --add safe.directory "$APP_DIR" >/dev/null 2>&1 || true
  git pull --ff-only
fi

# npm ci và build Next cần khoảng 2-3 GB RAM. VPS ít RAM mà chưa có swap thì tiến trình bị Killed
if [ "$(swapon --noheadings | wc -l)" -eq 0 ] && [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 4000000 ]; then
  log "Tạo swap 4 GB vì VPS ít RAM"
  [ -f /swapfile ] || { fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096; }
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# Giới hạn bộ nhớ Node để build không chiếm hết RAM
export NODE_OPTIONS="--max-old-space-size=1536"

log "Cài thư viện và build API"
npm ci --include=dev
npm run build -w @an-chi/api

log "Chạy migration database"
npm run db:deploy -w @an-chi/api
if [ "${SEED:-0}" = "1" ]; then
  log "Nạp dữ liệu mẫu"
  npm run db:seed -w @an-chi/api
fi

# Next prerender trang lúc build nên API phải chạy trước khi build web
log "Khởi động lại API"
pm2 delete anchi-api >/dev/null 2>&1 || true
pm2 start npm --name anchi-api --cwd "$APP_DIR/apps/api" -- start
for _ in $(seq 1 30); do
  curl -s -o /dev/null "http://127.0.0.1:${API_PORT}/health" && break
  sleep 1
done
curl -s -o /dev/null "http://127.0.0.1:${API_PORT}/health" || { pm2 logs anchi-api --lines 30 --nostream; die "API không khởi động được"; }

# Mã phiên bản cho Next, cùng giá trị lúc build và lúc chạy (pm2 kế thừa biến đã export)
export DEPLOYMENT_ID="$(git rev-parse --short HEAD 2>/dev/null || echo local)-$(date +%Y%m%d%H%M%S)"

log "Build CMS và web"
npm run build -w @an-chi/cms
npm run build -w @an-chi/web

log "Khởi động lại web"
pm2 delete anchi-web >/dev/null 2>&1 || true
pm2 start "$APP_DIR/node_modules/next/dist/bin/next" --name anchi-web --cwd "$APP_DIR/apps/web" -- start -p "$WEB_PORT" -H 127.0.0.1
pm2 save >/dev/null

log "Chép CMS vào ${CMS_ROOT}"
mkdir -p "$CMS_ROOT"
rm -rf "${CMS_ROOT:?}"/*
cp -r apps/cms/dist/. "$CMS_ROOT/"

log "Xong"
echo "Web: https://${DOMAIN}"
echo "CMS: https://${CMS_DOMAIN}"
pm2 status
