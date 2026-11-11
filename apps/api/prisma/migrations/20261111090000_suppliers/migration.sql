-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- AlterTable
ALTER TABLE "PurchaseBatch" ADD COLUMN "supplierId" TEXT;

-- Chuyển tên nhà cung cấp gõ tay ở các đợt cũ thành nhà cung cấp, mã ngẫu nhiên 10 ký tự. Chủ shop đổi mã trong CMS
INSERT INTO "Supplier" ("id", "name", "code", "updatedAt")
SELECT 'sup_' || md5(name), name, upper(substr(md5(random()::text || name), 1, 10)), CURRENT_TIMESTAMP
FROM (SELECT DISTINCT trim("supplier") AS name FROM "PurchaseBatch" WHERE "supplier" IS NOT NULL AND trim("supplier") <> '') AS s;

UPDATE "PurchaseBatch" b SET "supplierId" = s."id" FROM "Supplier" s WHERE trim(b."supplier") = s."name";

ALTER TABLE "PurchaseBatch" DROP COLUMN "supplier";

-- CreateIndex
CREATE INDEX "PurchaseBatch_supplierId_idx" ON "PurchaseBatch"("supplierId");

-- AddForeignKey
ALTER TABLE "PurchaseBatch" ADD CONSTRAINT "PurchaseBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
