-- CreateEnum
CREATE TYPE "BeadKind" AS ENUM ('BEAD', 'CHARM');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "design" JSONB;

-- CreateTable
CREATE TABLE "Bead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "BeadKind" NOT NULL DEFAULT 'BEAD',
    "material" TEXT NOT NULL,
    "sizeMm" DOUBLE PRECISION NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL,
    "finish" TEXT NOT NULL DEFAULT 'wood',
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bead_slug_key" ON "Bead"("slug");

-- CreateIndex
CREATE INDEX "Bead_active_position_idx" ON "Bead"("active", "position");
