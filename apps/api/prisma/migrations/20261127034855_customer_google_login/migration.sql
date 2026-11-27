-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "googleSub" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_googleSub_key" ON "Customer"("googleSub");

