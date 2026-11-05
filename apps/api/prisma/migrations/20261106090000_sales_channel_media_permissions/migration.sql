-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('WEB', 'SHOPEE', 'TIKTOK', 'REFERRAL', 'OTHER');

-- AlterEnum
ALTER TYPE "MaterialGroup" ADD VALUE 'CONSUMABLE';

-- AlterTable
ALTER TABLE "Bead" DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "channel" "SalesChannel" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "externalCode" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "platformFeeVnd" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingCostVnd" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "coverAlt" TEXT,
ADD COLUMN     "focusKeyword" TEXT,
ADD COLUMN     "ogDescription" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "ogTitle" TEXT;

-- AlterTable
ALTER TABLE "PurchaseExtra" ADD COLUMN     "allocate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "permissions" JSONB;

-- CreateTable
CREATE TABLE "MediaImage" (
    "id" TEXT NOT NULL,
    "image" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaImage_pkey" PRIMARY KEY ("id")
);

