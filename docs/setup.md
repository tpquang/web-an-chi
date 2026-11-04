# Triển khai An Chi lên VPS

Hướng dẫn từng lệnh để đưa website lên VPS Ubuntu với tên miền `tramhuonganchi.vn`. Mỗi lệnh có giải thích nó làm gì và kết quả đúng trông thế nào. Gõ (hoặc dán) từng lệnh một, chờ chạy xong, xem kết quả rồi mới sang lệnh tiếp theo.

Quy ước trong tài liệu:

- Chữ trong `<...>` là chỗ bạn thay bằng giá trị của mình, khi gõ thì bỏ luôn dấu `<` `>`. Ví dụ `ssh root@<IP-VPS>` thành `ssh root@103.12.34.56`.
- Dòng bắt đầu bằng `#` trong khối lệnh là chú thích, không cần gõ.
- Lệnh có ghi **(máy bạn)** chạy ở Terminal trên máy Mac. Lệnh có ghi **(VPS)** chạy sau khi đã `ssh` vào VPS.

## Sau khi xong sẽ có gì

| Địa chỉ | Dùng để | Chạy ở cổng nội bộ |
|---|---|---|
| `https://tramhuonganchi.vn` | Website bán hàng (Next.js) | 3100 |
| `https://www.tramhuonganchi.vn` | Như trên | 3100 |
| `https://mun.tramhuonganchi.vn` | Trang quản trị (CMS) | file tĩnh, nginx phục vụ |
| `https://mun.tramhuonganchi.vn/api/` | API cho CMS | 4100 |
| PostgreSQL trong Docker | Cơ sở dữ liệu | 5433, chỉ nghe `127.0.0.1` |

VPS đang chạy dịch vụ khác ở cổng 4000 và 5432, nên An Chi dùng cổng khác để không trùng. Script không sửa cấu hình nginx cũ, chỉ thêm file `/etc/nginx/sites-available/anchi.conf`.

## Cần chuẩn bị

- Mật khẩu hoặc SSH key để đăng nhập VPS bằng `root`.
- IP của VPS.
- Quyền vào trang quản lý tên miền `tramhuonganchi.vn`.
- Link repo Git chứa source, ví dụ `git@github.com:ten-ban/web-an-chi.git`.
- Một email thật để Let's Encrypt gửi thông báo khi chứng chỉ HTTPS sắp hết hạn.

---

## Bước 1. Trỏ tên miền về VPS

Vào trang quản lý DNS của tên miền (nơi bạn mua tên miền), thêm 3 bản ghi:

| Loại | Tên (Host) | Giá trị | TTL |
|---|---|---|---|
| A | `@` | IP VPS | mặc định |
| A | `www` | IP VPS | mặc định |
| A | `mun` | IP VPS | mặc định |

`@` là tên miền gốc `tramhuonganchi.vn`, `www` và `mun` (CMS) là tên miền con.

Kiểm tra **(máy bạn)**:

```bash
ping -c 1 tramhuonganchi.vn
```

- `ping` gửi một gói tin tới tên miền, `-c 1` là chỉ gửi 1 lần rồi dừng.
- Kết quả đúng: dòng đầu có dạng `PING tramhuonganchi.vn (103.12.34.56)`, trong ngoặc là IP VPS của bạn.
- Nếu báo `cannot resolve` hoặc ra IP khác: DNS chưa có hiệu lực, đợi 5 đến 30 phút rồi thử lại.

Làm tương tự cho hai tên miền con:

```bash
ping -c 1 www.tramhuonganchi.vn
ping -c 1 mun.tramhuonganchi.vn
```

Cả ba phải ra đúng IP VPS mới làm tiếp bước 7. Các bước 2 đến 6 có thể làm trong lúc chờ.

---

## Bước 2. Đẩy code lên Git (máy bạn)

Mở Terminal, vào thư mục dự án:

```bash
cd /Volumes/Q/Projects/web-an-chi
```

- `cd` là chuyển vào thư mục.

```bash
git status
```

- Xem những file đã thay đổi mà chưa commit.
- Kết quả: danh sách file màu đỏ, trong đó có `scripts/deploy.sh`, `.gitignore`, `docs/setup.md`.

```bash
git add scripts/deploy.sh .gitignore docs/setup.md
```

- Đánh dấu 3 file này để đưa vào lần commit tới. Không in gì là thành công.

```bash
git commit -m "Thêm script và hướng dẫn triển khai VPS"
```

- Lưu thay đổi thành một commit, `-m` là lời mô tả.
- Kết quả: dòng có dạng `3 files changed`.

```bash
git push
```

- Đẩy commit lên GitHub.
- Kết quả: dòng cuối có dạng `main -> main` hoặc tên nhánh bạn đang dùng.

Nếu bạn đang ở nhánh khác `main` (ví dụ `kho-dot-nhap`), nhớ tên nhánh này, bước 5 sẽ dùng tới. Xem tên nhánh bằng `git branch --show-current`.

---

## Bước 3. Đăng nhập VPS (máy bạn)

```bash
ssh root@<IP-VPS>
```

- `ssh` mở kết nối điều khiển VPS từ xa, `root` là tài khoản quản trị.
- Lần đầu sẽ hỏi `Are you sure you want to continue connecting (yes/no)?`, gõ `yes` rồi Enter.
- Nếu hỏi mật khẩu: gõ mật khẩu VPS rồi Enter. Khi gõ, màn hình không hiện ký tự nào, đó là bình thường.
- Kết quả: dấu nhắc đổi thành `root@cloud:~#`. Từ giờ mọi lệnh chạy trên VPS.

Muốn thoát VPS về máy bạn thì gõ `exit`.

---

## Bước 4. Kiểm tra VPS trước khi cài (VPS)

```bash
lsb_release -a
```

- Xem phiên bản Ubuntu. Kết quả đúng: `Ubuntu 22.04` hoặc `Ubuntu 24.04`.

```bash
free -h
```

- Xem RAM. Nhìn cột `total` ở dòng `Mem`. Dưới `2.0Gi` thì làm thêm phần [Thêm swap](#thêm-swap-khi-ram-ít) trước khi chạy script, nếu không lúc build dễ bị hết bộ nhớ.

```bash
df -h /
```

- Xem dung lượng ổ đĩa. Cột `Avail` (còn trống) nên từ 5G trở lên.

```bash
ss -tulpn | grep -E ':(3100|4100|5433)\b' || echo "Các cổng còn trống"
```

- `ss -tulpn` liệt kê các cổng đang dùng, `grep` lọc ra 3 cổng An Chi cần.
- Kết quả đúng: chỉ in ra `Các cổng còn trống`.
- Nếu in ra dòng nào khác, cổng đó đã bị chiếm, cần đổi cổng trong script (xem bước 6).

```bash
ls /etc/nginx/sites-enabled/
```

- Liệt kê các site nginx đang bật, ghi nhớ lại. Sau khi cài sẽ có thêm `anchi.conf`, những file khác là của dịch vụ cũ, không đụng vào.

```bash
grep -r "tramhuonganchi" /etc/nginx/sites-enabled/ || echo "Chưa có site nào dùng tên miền này"
```

- Kiểm tra có site cũ nào đã khai báo tên miền này chưa.
- Kết quả đúng: in ra `Chưa có site nào dùng tên miền này`. Nếu có, xem phần [Gặp lỗi](#gặp-lỗi).

---

## Bước 5. Tải source về VPS (VPS)

### 5.1. Cài git

```bash
apt-get update
```

- Cập nhật danh sách phần mềm có thể cài. Chạy mất vài giây, dòng cuối có dạng `Reading package lists... Done`.

```bash
apt-get install -y git
```

- Cài `git`. `-y` là tự đồng ý, không hỏi lại.
- Nếu đã có sẵn sẽ báo `git is already the newest version`.

```bash
git --version
```

- Kiểm tra git đã cài. Kết quả có dạng `git version 2.43.0`.

### 5.2. Cho VPS quyền đọc repo

Bỏ qua phần này nếu repo là public.

Repo private thì VPS cần một SSH key được GitHub cho phép.

```bash
ssh-keygen -t ed25519 -C "vps-anchi" -f ~/.ssh/id_ed25519 -N ""
```

- Tạo cặp khoá SSH cho VPS. `-N ""` là không đặt mật khẩu cho khoá.
- Nếu báo `already exists. Overwrite (y/n)?` thì gõ `n`, dùng khoá có sẵn.

```bash
cat ~/.ssh/id_ed25519.pub
```

- In khoá công khai, một dòng bắt đầu bằng `ssh-ed25519`.
- Chép cả dòng đó, vào GitHub: repo → **Settings** → **Deploy keys** → **Add deploy key**, dán vào ô **Key**, đặt tên `VPS`, để trống ô **Allow write access**, bấm **Add key**.

```bash
ssh -T git@github.com
```

- Kiểm tra VPS đã kết nối được GitHub. Lần đầu hỏi `yes/no`, gõ `yes`.
- Kết quả đúng: `Hi ten-ban/web-an-chi! You've successfully authenticated`.

### 5.3. Tạo thư mục và clone

```bash
mkdir -p /opt
```

- `mkdir` tạo thư mục, `-p` là không báo lỗi nếu thư mục đã có. `/opt` là nơi quen dùng để đặt ứng dụng cài thêm.

```bash
cd /opt
```

- Chuyển vào thư mục `/opt`. Dấu nhắc đổi thành `root@cloud:/opt#`.

```bash
git clone <link-repo> web-an-chi
```

- Tải toàn bộ source về thư mục mới tên `web-an-chi`.
- Ví dụ: `git clone git@github.com:ten-ban/web-an-chi.git web-an-chi`.
- Kết quả: dòng cuối có dạng `Resolving deltas: 100% ... done.`

```bash
cd /opt/web-an-chi
```

- Vào thư mục source. Từ đây trở đi mọi lệnh chạy trong thư mục này.

```bash
git checkout <ten-nhanh>
```

- Chuyển sang nhánh có code muốn chạy, ví dụ `git checkout main`. Bỏ qua nếu đã ở đúng nhánh.

```bash
ls
```

- Liệt kê file. Phải thấy `apps`, `scripts`, `docs`, `package.json`, `docker-compose.yml`.

```bash
ls scripts
```

- Phải thấy `deploy.sh`. Không thấy nghĩa là bước 2 chưa push, hoặc bạn đang ở nhánh khác.

---

## Bước 6. Xem lại cấu hình trước khi chạy (VPS)

```bash
nano scripts/deploy.sh
```

- `nano` là trình sửa file trên terminal. Dùng phím mũi tên để di chuyển.

Những dòng nên xem, ở gần đầu file:

- `DOMAIN="${DOMAIN:-tramhuonganchi.vn}"`: tên miền chính.
- `WEB_PORT=3100`, `API_PORT=4100`, `DB_PORT=5433`: các cổng nội bộ. Nếu bước 4 báo cổng nào bị chiếm, đổi số ở đây.

Ở khoảng giữa file:

- `SITE_INDEXING=on`: cho Google index website. Nếu mới là bản chạy thử, sửa thành `SITE_INDEXING=` (để trống), toàn site sẽ có `noindex`.

Lưu và thoát:

- `Ctrl + O` rồi Enter để lưu.
- `Ctrl + X` để thoát.
- Không sửa gì thì chỉ cần `Ctrl + X`.

Nếu có sửa, kiểm tra script không bị gõ nhầm cú pháp:

```bash
bash -n scripts/deploy.sh && echo "Cú pháp OK"
```

- `bash -n` đọc script mà không chạy. Kết quả đúng: `Cú pháp OK`.

---

## Bước 7. Chạy script triển khai (VPS)

Kiểm tra lại DNS đã trỏ xong (bước 1), ngay trên VPS:

```bash
getent hosts tramhuonganchi.vn mun.tramhuonganchi.vn www.tramhuonganchi.vn
```

- In IP của từng tên miền. Cả ba phải là IP VPS này. Chưa đúng thì đợi thêm, vì bước xin HTTPS cần DNS đã xong.

Chạy script:

```bash
sudo EMAIL=quangtran.180495@gmail.com bash scripts/deploy.sh

```

- `EMAIL=...` truyền email cho Let's Encrypt. Ví dụ `sudo EMAIL=quang@gmail.com bash scripts/deploy.sh`.
- Muốn có sẵn sản phẩm, bài viết, đơn hàng mẫu để xem thử, thêm `SEED=1`:

  ```bash
  sudo EMAIL=<email-cua-ban> SEED=1 bash scripts/deploy.sh
  ```

  Chỉ dùng `SEED=1` lần đầu, khi chưa có dữ liệu thật.

Lần đầu mất khoảng 5 đến 15 phút. Đừng đóng Terminal trong lúc chạy. Mỗi bước in một dòng `==>` màu xanh:

| Dòng in ra | Script đang làm |
|---|---|
| `==> Cài gói hệ thống` | Cài nginx, certbot, curl, openssl |
| `==> Cài Node.js 22` | Chỉ hiện khi máy chưa có Node 22.12 trở lên |
| `==> Cài Docker` | Chỉ hiện khi máy chưa có Docker |
| `==> Tạo file .env` | Tạo cấu hình cho API, web, CMS. Mật khẩu database, mật khẩu admin, `AUTH_SECRET` được sinh ngẫu nhiên. `apps/api/.env` đã có thì giữ nguyên |
| `==> Khởi động PostgreSQL riêng` | Chạy database trong Docker, tách biệt với Postgres của dịch vụ cũ |
| `==> Cài thư viện và build API` | `npm ci` rồi build API |
| `==> Chạy migration database` | Tạo bảng trong database. Có `SEED=1` thì nạp thêm dữ liệu mẫu |
| `==> Khởi động API` | Chạy `anchi-api` nền bằng PM2. Web cần gọi API lúc build nên API phải chạy trước |
| `==> Build CMS và web` | Bước lâu nhất |
| `==> Khởi động web` | Chạy `anchi-web` nền, cả hai tự bật lại khi VPS khởi động lại |
| `==> Chép CMS` | Chép CMS đã build vào `/var/www/anchi-cms` |
| `==> Cấu hình nginx` | Ghi file nginx, kiểm tra bằng `nginx -t` rồi reload. Cấu hình sai thì dừng trước khi reload, site cũ không bị ảnh hưởng |
| `==> Xin chứng chỉ HTTPS` | Xin chứng chỉ cho 3 tên miền, tự chuyển `http` sang `https` |
| `==> Xong` | In địa chỉ web, CMS và tài khoản admin |

Script gặp lỗi ở đâu sẽ dừng ngay ở đó và in `Lỗi: ...` hoặc thông báo lỗi của lệnh bị hỏng. Chụp lại màn hình phần cuối để tra. Riêng bước xin HTTPS lỗi thì chỉ in cảnh báo, script vẫn chạy hết.

---

## Bước 8. Lưu tài khoản CMS (VPS)

Cuối lần chạy đầu, script in ra:

```
Tài khoản CMS: admin / <mật-khẩu>
```

Chép lại ngay vào trình quản lý mật khẩu. Quên thì xem lại bằng:

```bash
grep ADMIN_ /opt/web-an-chi/apps/api/.env
```

- In hai dòng `ADMIN_EMAIL=...` và `ADMIN_PASSWORD=...`.

Muốn đổi email hoặc mật khẩu admin:

```bash
nano /opt/web-an-chi/apps/api/.env
```

- Sửa `ADMIN_EMAIL` và `ADMIN_PASSWORD` (mật khẩu ít nhất 8 ký tự), lưu bằng `Ctrl + O`, Enter, `Ctrl + X`.

```bash
pm2 restart anchi-api
```

- Khởi động lại API để nhận cấu hình mới.

---

## Bước 9. Kiểm tra (VPS rồi trình duyệt)

```bash
pm2 status
```

- Bảng liệt kê ứng dụng PM2 đang quản lý. `anchi-api` và `anchi-web` phải có cột `status` là `online`.
- Nếu là `errored` hoặc số ở cột `↺` (số lần khởi động lại) cứ tăng: xem log bằng `pm2 logs anchi-api --lines 50`.

```bash
curl -I http://127.0.0.1:3100
```

- `curl -I` gọi thử một địa chỉ và chỉ in phần đầu phản hồi. Đây là gọi thẳng vào web, không qua nginx.
- Kết quả đúng: dòng đầu `HTTP/1.1 200 OK`.

```bash
curl -I https://tramhuonganchi.vn
```

- Gọi qua nginx và HTTPS. Kết quả đúng: `HTTP/2 200`.

```bash
curl -I https://mun.tramhuonganchi.vn
```

- Kết quả đúng: `HTTP/2 200`.

```bash
docker ps --filter name=anchi
```

- Liệt kê container của An Chi. Phải thấy `anchi-postgres-1` với cột `STATUS` là `Up ... (healthy)`.

Mở trình duyệt trên máy bạn và đánh dấu từng mục:

- [ ] `https://tramhuonganchi.vn` hiện trang chủ, thanh địa chỉ có ổ khoá.
- [ ] `http://tramhuonganchi.vn` tự chuyển sang `https`.
- [ ] `https://www.tramhuonganchi.vn` mở được.
- [ ] `https://mun.tramhuonganchi.vn` hiện trang đăng nhập, đăng nhập được bằng tài khoản ở bước 8.
- [ ] Gửi thử một tin nhắn chat trên website, tin nhắn hiện ra trong hộp thư CMS mà không cần tải lại trang.
- [ ] Dịch vụ cũ trên VPS vẫn chạy bình thường.

---

## Cập nhật code về sau

Mỗi lần có code mới, trên máy bạn `git push` như bước 2, rồi trên VPS:

```bash
cd /opt/web-an-chi
sudo bash scripts/update.sh
```

- Script tự `git pull`, cài thư viện, chạy migration database, build API, CMS, web rồi khởi động lại. Không đụng tới nginx, HTTPS, mật khẩu, dữ liệu.
- Thêm `SEED=1` để nạp lại dữ liệu mẫu (sản phẩm, bài viết, hạt vòng tay): `sudo SEED=1 bash scripts/update.sh`. Dữ liệu mẫu cùng mã sẽ bị ghi đè, nên chỉ dùng khi web còn là bản demo.
- Lần đầu dùng `update.sh` trên VPS đã cài từ trước: chạy `sudo bash scripts/deploy.sh` một lần để script tạo file `.deploy.env` (tên miền, cổng). Từ đó về sau chỉ cần `update.sh`.

## Google index

Mặc định tắt vì web đang là bản demo: `robots.txt` chặn hết, mọi trang có `noindex`, nginx gửi thêm `X-Robots-Tag`. CMS luôn `noindex`.

Khi mở bán thật, bật lên bằng:

```bash
sudo INDEXING=on bash scripts/deploy.sh
```

Sau đó vào Google Search Console gửi `https://<ten-mien>/sitemap.xml`.

## Chuyển sang VPS khác

1. Trên VPS cũ, sao lưu database:

```bash
cd /opt/web-an-chi
sudo docker compose -p anchi exec -T postgres pg_dump -U anchi -d anchi -Fc > anchi.dump
```

2. Chép `anchi.dump` và `apps/api/.env` sang máy mới (ví dụ bằng `scp`). Giữ `apps/api/.env` để không đổi mật khẩu admin và khoá đăng nhập.
3. Trên VPS mới làm lại từ bước 3 (clone repo vào `/opt/web-an-chi`), đặt `apps/api/.env` vào trước khi chạy script, rồi chạy `sudo EMAIL=<email-cua-ban> bash scripts/deploy.sh`. Cổng bị chiếm thì thêm `WEB_PORT=... API_PORT=... DB_PORT=...`; nhớ sửa `PORT` và cổng trong `DATABASE_URL` của `apps/api/.env` cho khớp.
4. Nạp lại database:

```bash
cd /opt/web-an-chi
sudo docker compose -p anchi exec -T postgres pg_restore -U anchi -d anchi --clean --if-exists < anchi.dump
pm2 restart anchi-api anchi-web
```

5. Trỏ DNS về IP mới. Nếu lúc chạy script DNS chưa trỏ xong, HTTPS sẽ báo lỗi: đợi DNS xong rồi chạy lại `deploy.sh`.

---

## Đổi tên miền khi đã cài rồi

Dùng khi VPS đã chạy script với tên miền cũ (ví dụ `viettel-synergy.io.vn`) và giờ chuyển sang `tramhuonganchi.vn`, CMS ở `mun.tramhuonganchi.vn`.

1. Trỏ DNS của `tramhuonganchi.vn`: bản ghi A cho `@`, `www`, `mun` về IP VPS (như bước 1). Kiểm tra bằng `getent hosts tramhuonganchi.vn www.tramhuonganchi.vn mun.tramhuonganchi.vn`.
2. Lấy code mới và chạy lại script:

```bash
cd /opt/web-an-chi
git pull
sudo EMAIL=quangtran.180495@gmail.com bash scripts/deploy.sh
```

- Script ghi đè `anchi.conf` của nginx bằng tên miền mới, build lại web và CMS với địa chỉ mới, tự sửa `CORS_ORIGINS` trong `apps/api/.env`, rồi xin chứng chỉ HTTPS mới.
- Mật khẩu database và tài khoản admin giữ nguyên. Email đăng nhập CMS vẫn là email cũ (`admin@viettel-synergy.io.vn`), xem bằng `grep ADMIN_ /opt/web-an-chi/apps/api/.env`.

3. Xoá chứng chỉ của tên miền cũ (không bắt buộc):

```bash
sudo certbot certificates
sudo certbot delete --cert-name viettel-synergy.io.vn
```

- Lệnh đầu liệt kê chứng chỉ, chỉ xoá cái chứa tên miền cũ và không còn dùng.

---

## Lệnh hay dùng

| Việc | Lệnh |
|---|---|
| Xem trạng thái | `pm2 status` |
| Xem log API (thoát bằng `Ctrl + C`) | `pm2 logs anchi-api` |
| Xem log web | `pm2 logs anchi-web` |
| Khởi động lại | `pm2 restart anchi-api anchi-web` |
| Xem log lỗi nginx | `tail -f /var/log/nginx/error.log` |
| Xem database chạy chưa | `docker ps --filter name=anchi` |
| Vào database (thoát bằng `\q`) | `docker exec -it anchi-postgres-1 psql -U anchi -d anchi` |
| Thử gia hạn HTTPS | `certbot renew --dry-run` |

Chứng chỉ HTTPS tự gia hạn, certbot đã cài sẵn lịch chạy.

## Sao lưu database

### Sao lưu một lần

```bash
mkdir -p /root/backups
```

- Tạo thư mục chứa bản sao lưu (VPS đã có sẵn thư mục `backups` ở `/root`).

```bash
docker exec anchi-postgres-1 pg_dump -U anchi anchi | gzip > /root/backups/anchi-$(date +%F).sql.gz
```

- `pg_dump` xuất toàn bộ database, `gzip` nén lại, lưu thành file có ngày, ví dụ `anchi-2026-11-04.sql.gz`.

```bash
ls -lh /root/backups
```

- Xem file vừa tạo và dung lượng.

### Sao lưu tự động mỗi ngày

```bash
crontab -e
```

- Mở lịch chạy tự động. Lần đầu hỏi chọn trình sửa, gõ `1` (nano) rồi Enter.

Thêm dòng sau vào cuối file, lưu bằng `Ctrl + O`, Enter, `Ctrl + X`:

```
0 2 * * * docker exec anchi-postgres-1 pg_dump -U anchi anchi | gzip > /root/backups/anchi-$(date +\%F).sql.gz && find /root/backups -name 'anchi-*.sql.gz' -mtime +14 -delete
```

- Chạy lúc 2 giờ sáng mỗi ngày, xoá bản cũ hơn 14 ngày.

```bash
crontab -l
```

- Kiểm tra dòng vừa thêm đã được lưu.

### Khôi phục

```bash
gunzip -c /root/backups/anchi-2026-11-04.sql.gz | docker exec -i anchi-postgres-1 psql -U anchi -d anchi
```

- Thay ngày bằng file bạn muốn khôi phục.

Nên chép bản sao lưu ra ngoài VPS định kỳ, vì VPS hỏng thì bản sao lưu trên đó cũng mất. Từ máy bạn:

```bash
scp root@<IP-VPS>:/root/backups/anchi-*.sql.gz ~/Downloads/
```

## Thêm swap khi RAM ít

Chạy khi bước 4 thấy RAM dưới 2 GB, trước bước 7.

```bash
swapon --show
```

- Xem đã có swap chưa. Có dòng in ra thì đã có, bỏ qua phần này.

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

- Tạo file 2 GB, chỉ `root` đọc được, định dạng làm swap, rồi bật lên.

```bash
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

- Ghi vào `/etc/fstab` để swap tự bật lại sau khi VPS khởi động lại.

```bash
free -h
```

- Dòng `Swap` giờ phải có `2.0Gi`.

## Gặp lỗi

**Xin HTTPS báo lỗi.** Thường do DNS chưa trỏ xong. Kiểm tra lại bước 1, rồi chạy lại `sudo EMAIL=<email-cua-ban> bash scripts/deploy.sh`.

**Trang báo `502 Bad Gateway`.** Web hoặc API chưa chạy. Xem `pm2 status` và `pm2 logs`.

**CMS đăng nhập báo lỗi mạng.** Kiểm tra cấu hình:

```bash
grep CORS_ORIGINS /opt/web-an-chi/apps/api/.env
cat /opt/web-an-chi/apps/cms/.env
```

- Phải ra `CORS_ORIGINS=https://mun.tramhuonganchi.vn` và `VITE_API_URL=https://mun.tramhuonganchi.vn`. Sửa sai thì chạy lại script.

**`npm run build` bị dừng với chữ `Killed` hoặc `heap out of memory`.** Hết RAM, làm phần [Thêm swap](#thêm-swap-khi-ram-ít) rồi chạy lại script.

**Bước database báo sai mật khẩu (`password authentication failed`).** Xảy ra khi đã xoá `apps/api/.env` sau lần chạy đầu: script sinh mật khẩu mới nhưng database vẫn giữ mật khẩu cũ. Nếu database chưa có dữ liệu thật, xoá database để làm lại:

```bash
cd /opt/web-an-chi
docker compose -p anchi down -v
sudo bash scripts/deploy.sh
```

Lệnh `down -v` xoá toàn bộ dữ liệu An Chi. Có dữ liệu thật thì sao lưu trước.

**Nginx báo `conflicting server name`.** Một site cũ trên VPS đã khai báo cùng tên miền. Tìm bằng `grep -r tramhuonganchi /etc/nginx/sites-enabled/` và tắt site đó.

## Bảo mật

- Database của dịch vụ cũ đang mở ra internet ở cổng 5432 (`0.0.0.0:5432`). Database An Chi chỉ nghe nội bộ nên không bị ảnh hưởng, nhưng nên sửa dịch vụ cũ cho nó chỉ nghe `127.0.0.1`.
- Bật firewall, chỉ mở SSH và web. Chạy đúng thứ tự, mở SSH trước để không tự khoá mình ngoài VPS:

  ```bash
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw enable
  ufw status
  ```

  Docker có thể vượt qua `ufw` với các cổng nó mở, nên cách chắc chắn vẫn là cho dịch vụ cũ chỉ nghe `127.0.0.1`.
- Không commit các file `.env` lên Git. `.gitignore` đã chặn sẵn.
- `apps/api/.env` chứa mật khẩu, chỉ `root` đọc được (`chmod 600`).

## Gỡ An Chi khỏi VPS

Sao lưu trước nếu cần, các lệnh dưới xoá luôn dữ liệu.

```bash
pm2 delete anchi-api anchi-web
pm2 save
```

- Dừng và gỡ web, API khỏi PM2.

```bash
rm /etc/nginx/sites-enabled/anchi.conf /etc/nginx/sites-available/anchi.conf
nginx -t
systemctl reload nginx
```

- Xoá cấu hình nginx của An Chi, kiểm tra rồi reload. Site cũ không bị ảnh hưởng.

```bash
cd /opt/web-an-chi
docker compose -p anchi down -v
```

- Dừng và xoá database cùng dữ liệu.

```bash
cd /
rm -rf /var/www/anchi-cms /opt/web-an-chi
```

- Xoá file CMS và source.
