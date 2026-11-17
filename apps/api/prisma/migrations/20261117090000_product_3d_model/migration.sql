-- CreateEnum
CREATE TYPE "Product3DModel" AS ENUM ('ROUND_BOX');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "model3d" "Product3DModel";

-- Sản phẩm nụ trầm đóng hộp tròn có sẵn thì bật xem 3D luôn
UPDATE "Product" SET "model3d" = 'ROUND_BOX' WHERE "name" ILIKE '%hộp tròn%';
