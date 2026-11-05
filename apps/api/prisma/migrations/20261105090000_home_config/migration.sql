-- AlterTable
ALTER TABLE "Post" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SiteImage" (
    "id" TEXT NOT NULL,
    "image" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("id")
);
