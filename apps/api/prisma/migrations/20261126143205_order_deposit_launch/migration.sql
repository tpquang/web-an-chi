-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DEPOSITED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "depositVnd" INTEGER NOT NULL DEFAULT 0;

-- Giờ mở bán chuyển từ biến môi trường NEXT_PUBLIC_LAUNCH_AT của web vào cài đặt cửa hàng.
-- Giữ đúng ngày đang chạy cho cửa hàng chưa có giá trị này; sửa tiếp ở CMS > Thông tin cửa hàng
UPDATE "Setting"
SET "value" = jsonb_set("value"::jsonb, '{launchAt}', '"2026-12-12T00:00:00+07:00"'::jsonb), "updatedAt" = NOW()
WHERE "key" = 'store' AND NOT ("value"::jsonb ? 'launchAt');
