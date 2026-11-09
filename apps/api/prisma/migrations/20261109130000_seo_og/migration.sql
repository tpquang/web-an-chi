-- Chữ và ảnh khi chia sẻ mạng xã hội cho sản phẩm, danh mục, chủ đề (bài viết đã có)
ALTER TABLE "Category" ADD COLUMN "ogTitle" TEXT, ADD COLUMN "ogDescription" TEXT, ADD COLUMN "ogImageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "ogTitle" TEXT, ADD COLUMN "ogDescription" TEXT, ADD COLUMN "ogImageUrl" TEXT;
ALTER TABLE "PostCategory" ADD COLUMN "ogTitle" TEXT, ADD COLUMN "ogDescription" TEXT, ADD COLUMN "ogImageUrl" TEXT;
