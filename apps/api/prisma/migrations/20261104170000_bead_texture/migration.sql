-- CreateTable
CREATE TABLE "BeadTexture" (
    "id" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "image" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "roughness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeadTexture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeadTexture_material_key" ON "BeadTexture"("material");
