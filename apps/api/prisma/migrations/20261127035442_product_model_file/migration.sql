-- CreateTable
CREATE TABLE "ProductModel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductModel_productId_key" ON "ProductModel"("productId");

-- AddForeignKey
ALTER TABLE "ProductModel" ADD CONSTRAINT "ProductModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
