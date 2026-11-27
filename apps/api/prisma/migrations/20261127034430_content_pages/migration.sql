-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "focusKeyword" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
