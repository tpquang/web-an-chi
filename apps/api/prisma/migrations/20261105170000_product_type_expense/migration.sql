-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('RETAIL', 'SUPPLY', 'CUSTOM');

-- AlterEnum
ALTER TYPE "MaterialGroup" ADD VALUE 'PRODUCT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'RETAIL',
ALTER COLUMN "priceVnd" SET DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "unitCostVnd" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Material" ADD COLUMN "markupPct" DOUBLE PRECISION;
ALTER TABLE "Bead" ADD COLUMN "materialId" TEXT;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "spentAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_spentAt_idx" ON "Expense"("spentAt");

-- AddForeignKey
ALTER TABLE "Bead" ADD CONSTRAINT "Bead_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
