-- CreateEnum
CREATE TYPE "MaterialGroup" AS ENUM ('PACKAGING', 'BEAD', 'INCENSE');

-- AlterTable
ALTER TABLE "Material" ADD COLUMN "group" "MaterialGroup" NOT NULL DEFAULT 'PACKAGING';

-- Hạt và charm đã có thuộc nhóm vòng hạt
UPDATE "Material" SET "group" = 'BEAD' WHERE "kind" <> 'GENERAL';
