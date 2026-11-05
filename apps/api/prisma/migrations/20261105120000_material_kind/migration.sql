-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('GENERAL', 'BEAD', 'CHARM');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN "kind" "MaterialKind" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "beadMaterial" TEXT;

-- CreateTable
CREATE TABLE "MaterialModel" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialModel_materialId_key" ON "MaterialModel"("materialId");

-- AddForeignKey
ALTER TABLE "MaterialModel" ADD CONSTRAINT "MaterialModel_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
