-- CreateEnum
CREATE TYPE "CancelActor" AS ENUM ('CUSTOMER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('CREATED', 'STATUS', 'PAYMENT', 'REFUND', 'NOTE');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledBy" "CancelActor",
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "paidVnd" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentDueAt" TIMESTAMP(3),
ADD COLUMN     "refundVnd" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "trackingCode" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "requiresDeposit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderEventType" NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus",
    "amountVnd" INTEGER,
    "note" TEXT,
    "actor" TEXT NOT NULL,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentDueAt_idx" ON "Order"("paymentDueAt");

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Đơn cũ: số tiền đã nhận suy ra từ trạng thái thanh toán đang có
UPDATE "Order" SET "paidVnd" = "totalVnd" WHERE "paymentStatus" = 'PAID';
UPDATE "Order" SET "paidVnd" = "depositVnd" WHERE "paymentStatus" = 'DEPOSITED';
UPDATE "Order" SET "paidVnd" = "totalVnd", "refundVnd" = "totalVnd", "refundedAt" = "updatedAt" WHERE "paymentStatus" = 'REFUNDED';

-- Đơn cũ: một dòng lịch sử "tạo đơn" để dòng thời gian không trống
INSERT INTO "OrderEvent" ("id", "orderId", "type", "toStatus", "actor", "staffId", "createdAt")
SELECT 'mig' || substr(md5("id"), 1, 22), "id", 'CREATED', "status", CASE WHEN "createdById" IS NULL THEN 'Khách' ELSE 'Nhân viên' END, "createdById", "createdAt"
FROM "Order";
