#!/usr/bin/env bash
# Cài An Chi lên VPS Ubuntu mới bằng một lệnh: sudo bash scripts/deploy.sh
# Lo phần một lần: gói hệ thống, .env, database, nginx, HTTPS. Phần build gọi scripts/update.sh.
# Cập nhật code về sau chỉ cần: sudo bash scripts/update.sh
# Đổi VPS: clone repo sang máy mới, chạy lại script này (xem docs/setup.md phần chuyển VPS).
#
#   https://DOMAIN        → web (Next.js)
#   https://mun.DOMAIN    → CMS (file tĩnh), /api/ trên cùng tên miền → API
#
# Biến tuỳ chọn: DOMAIN, CMS_DOMAIN, EMAIL (cho Let's Encrypt), SEED=0 (không nạp dữ liệu ban đầu; mặc định nạp), SKIP_SSL=1,
#   INDEXING=on (cho Google index; mặc định off vì đang là web demo),
#   GA_ID=G-XXXX (mã đo GA4, chỉ nạp khi INDEXING=on), GOOGLE_SITE_VERIFICATION (mã thẻ meta Search Console),
#   WEB_PORT, API_PORT, DB_PORT (đổi khi VPS mới có dịch vụ khác chiếm cổng)
set -euo pipefail

DOMAIN="${DOMAIN:-tramhuonganchi.vn}"
CMS_DOMAIN="${CMS_DOMAIN:-mun.${DOMAIN}}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
# Cổng 4000 và 5432 trên VPS đã có dịch vụ khác dùng
WEB_PORT="${WEB_PORT:-3100}"
API_PORT="${API_PORT:-4100}"
DB_PORT="${DB_PORT:-5433}"
INDEXING="${INDEXING:-off}"
GA_ID="${GA_ID:-}"
GOOGLE_SITE_VERIFICATION="${GOOGLE_SITE_VERIFICATION:-}"

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
ADMIN_EMAIL=admin
ADMIN_PASSWORD=${ADMIN_PASS}
AUTH_SECRET=$(openssl rand -hex 32)
DEV_LOGIN=off
EOF
  chmod 600 apps/api/.env
  NEW_ADMIN=1
fi
# .env cũ được giữ, nhưng CORS phải theo tên miền CMS hiện tại (đổi tên miền thì tự cập nhật)
sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=https://${CMS_DOMAIN}#" apps/api/.env
cat > apps/web/.env <<EOF
API_URL=http://127.0.0.1:${API_PORT}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
SITE_INDEXING=${INDEXING}
NEXT_PUBLIC_GA_ID=${GA_ID}
GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION}
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

# Lưu cấu hình để scripts/update.sh dùng lại
cat > .deploy.env <<EOF
DOMAIN=${DOMAIN}
CMS_DOMAIN=${CMS_DOMAIN}
WEB_PORT=${WEB_PORT}
API_PORT=${API_PORT}
CMS_ROOT=${CMS_ROOT}
INDEXING=${INDEXING}
EOF

# Cài lần đầu nạp dữ liệu ban đầu: danh mục, nguyên liệu, công thức sản phẩm, hạt, bài viết.
# Database đã có nguyên liệu hoặc sản phẩm thì bỏ qua, nên chạy lại script trên server cũ không ghi đè dữ liệu thật
NO_PULL=1 SEED="${SEED:-1}" bash "$APP_DIR/scripts/update.sh"
pm2 startup systemd -u root --hp /root >/dev/null

ROBOTS_HEADER=""
[ "$INDEXING" = "on" ] || ROBOTS_HEADER='    add_header X-Robots-Tag "noindex, nofollow" always;'
log "Cấu hình nginx cho ${DOMAIN} và ${CMS_DOMAIN}"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 10m;
${ROBOTS_HEADER}

    # JS, CSS của Next có mã băm trong tên file, đổi mỗi lần build nên cache lâu được
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
${ROBOTS_HEADER}
    }

    # Ảnh tối ưu để Next tự đặt cache
    location /_next/image {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # HTML không được giữ bản cũ: trình duyệt luôn hỏi lại server, nếu không đổi thì nhận 304
    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-cache" always;
${ROBOTS_HEADER}
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${CMS_DOMAIN};
    root ${CMS_ROOT};
    index index.html;
    client_max_body_size 10m;
    # CMS không bao giờ được index
    add_header X-Robots-Tag "noindex, nofollow" always;

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

    # add_header trong location thay hẳn add_header của server, nên ghi lại X-Robots-Tag
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }

    # index.html trỏ tới file JS, CSS mới sau mỗi lần build nên không được cache
    location / {
        try_files \$uri /index.html;
        add_header Cache-Control "no-cache" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
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
