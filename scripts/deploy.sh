#!/usr/bin/env bash
# Triển khai An Chi lên VPS Ubuntu bằng một lệnh: sudo bash scripts/deploy.sh
# Chạy lại nhiều lần được: lần sau chỉ build lại và khởi động lại.
#
#   https://DOMAIN        → web (Next.js)
#   https://cms.DOMAIN    → CMS (file tĩnh), /api/ trên cùng tên miền → API
#
# Biến tuỳ chọn: DOMAIN, EMAIL (cho Let's Encrypt), SEED=1 (nạp dữ liệu mẫu), SKIP_SSL=1
set -euo pipefail

DOMAIN="${DOMAIN:-viettel-synergy.io.vn}"
CMS_DOMAIN="cms.${DOMAIN}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
# Cổng 4000 và 5432 trên VPS đã có dịch vụ khác dùng
WEB_PORT=3100
API_PORT=4100
DB_PORT=5433

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CMS_ROOT="/var/www/anchi-cms"
NGINX_CONF="/etc/nginx/sites-available/anchi.conf"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mLỗi: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Hãy chạy bằng sudo: sudo bash scripts/deploy.sh"
cd "$APP_DIR"

log "Cài gói hệ thống"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates openssl nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null || ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)'; then
  log "Cài Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2
command -v docker >/dev/null || { log "Cài Docker"; curl -fsSL https://get.docker.com | sh; }

log "Tạo file .env (giữ nguyên nếu đã có)"
if [ ! -f apps/api/.env ]; then
  DB_PASS="$(openssl rand -hex 16)"
  ADMIN_PASS="$(openssl rand -base64 12 | tr -d '/+=')"
  cat > apps/api/.env <<EOF
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=postgresql://anchi:${DB_PASS}@127.0.0.1:${DB_PORT}/anchi
CORS_ORIGINS=https://${CMS_DOMAIN}
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=${ADMIN_PASS}
AUTH_SECRET=$(openssl rand -hex 32)
DEV_LOGIN=off
EOF
  chmod 600 apps/api/.env
  NEW_ADMIN=1
fi
cat > apps/web/.env <<EOF
API_URL=http://127.0.0.1:${API_PORT}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
SITE_INDEXING=on
IMAGE_HOSTNAMES=
EOF
echo "VITE_API_URL=https://${CMS_DOMAIN}" > apps/cms/.env

# Mật khẩu database lấy từ DATABASE_URL để docker compose dùng cùng giá trị
DB_PASS="$(sed -n 's#^DATABASE_URL=postgresql://anchi:\([^@]*\)@.*#\1#p' apps/api/.env)"

log "Khởi động PostgreSQL riêng (Docker, cổng ${DB_PORT}, chỉ nghe 127.0.0.1)"
cat > docker-compose.prod.yml <<EOF
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASS}
EOF
docker compose -p anchi -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
until docker compose -p anchi -f docker-compose.yml exec -T postgres pg_isready -U anchi -d anchi >/dev/null 2>&1; do sleep 2; done

log "Cài thư viện và build API"
npm ci --include=dev
npm run build -w @an-chi/api

log "Chạy migration database"
npm run db:deploy -w @an-chi/api
if [ "${SEED:-0}" = "1" ]; then npm run db:seed -w @an-chi/api; fi

# Next prerender trang lúc build nên API phải chạy trước khi build web
log "Khởi động API"
pm2 delete anchi-api anchi-web >/dev/null 2>&1 || true
pm2 start npm --name anchi-api --cwd "$APP_DIR/apps/api" -- start
for _ in $(seq 1 30); do
  curl -s -o /dev/null "http://127.0.0.1:${API_PORT}/" && break
  sleep 1
done
curl -s -o /dev/null "http://127.0.0.1:${API_PORT}/" || { pm2 logs anchi-api --lines 30 --nostream; die "API không khởi động được"; }

log "Build CMS và web"
npm run build -w @an-chi/cms
npm run build -w @an-chi/web

log "Khởi động web"
pm2 start "$APP_DIR/node_modules/next/dist/bin/next" --name anchi-web --cwd "$APP_DIR/apps/web" -- start -p "$WEB_PORT" -H 127.0.0.1
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null

log "Chép CMS vào ${CMS_ROOT}"
mkdir -p "$CMS_ROOT"
rm -rf "${CMS_ROOT:?}"/*
cp -r apps/cms/dist/. "$CMS_ROOT/"

log "Cấu hình nginx cho ${DOMAIN} và ${CMS_DOMAIN}"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${CMS_DOMAIN};
    root ${CMS_ROOT};
    index index.html;
    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        # Hộp thư CMS dùng Server-Sent Events, không được đệm
        proxy_buffering off;
        proxy_read_timeout 1h;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files \$uri /index.html;
    }
}
EOF
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/anchi.conf
nginx -t
systemctl reload nginx

if [ "${SKIP_SSL:-0}" != "1" ]; then
  log "Xin chứng chỉ HTTPS (Let's Encrypt)"
  certbot --nginx --non-interactive --agree-tos --redirect -m "$EMAIL" \
    -d "$DOMAIN" -d "www.${DOMAIN}" -d "$CMS_DOMAIN" \
    || echo "Chưa xin được HTTPS. Kiểm tra DNS đã trỏ về VPS chưa rồi chạy lại script."
fi

log "Xong"
echo "Web: https://${DOMAIN}"
echo "CMS: https://${CMS_DOMAIN}"
if [ "${NEW_ADMIN:-0}" = "1" ]; then
  echo "Tài khoản CMS: $(grep ^ADMIN_EMAIL apps/api/.env | cut -d= -f2) / $(grep ^ADMIN_PASSWORD apps/api/.env | cut -d= -f2)"
  echo "Hãy lưu lại mật khẩu này. Xem lại trong apps/api/.env"
fi
echo "Xem log: pm2 logs"
