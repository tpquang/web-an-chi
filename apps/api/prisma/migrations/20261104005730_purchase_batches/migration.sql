-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PLANNED', 'ORDERED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "PurchaseMode" AS ENUM ('BY_KG', 'BY_UNIT');

-- CreateTable
CREATE TABLE "PurchaseBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "orderedAt" TIMESTAMP(3),
    "status" "BatchStatus" NOT NULL DEFAULT 'PLANNED',
    "capitalVnd" INTEGER,
    "feePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "mode" "PurchaseMode" NOT NULL,
    "kg" DOUBLE PRECISION,
    "costPerKgVnd" INTEGER,
    "piecesPerKg" INTEGER,
    "piecesPerBox" INTEGER,
    "lossPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER,
    "unitCostVnd" INTEGER,
    "packVnd" INTEGER NOT NULL DEFAULT 0,
    "salePriceVnd" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseExtra" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "amountVnd" INTEGER NOT NULL,

    CONSTRAINT "PurchaseExtra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseBatch_createdAt_idx" ON "PurchaseBatch"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseItem_batchId_position_idx" ON "PurchaseItem"("batchId", "position");

-- CreateIndex
CREATE INDEX "PurchaseExtra_batchId_position_idx" ON "PurchaseExtra"("batchId", "position");

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PurchaseBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseExtra" ADD CONSTRAINT "PurchaseExtra_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PurchaseBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
