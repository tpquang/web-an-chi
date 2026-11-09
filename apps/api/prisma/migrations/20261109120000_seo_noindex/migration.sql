-- Cờ ẩn khỏi Google cho trang có slug
ALTER TABLE "Category" ADD COLUMN "noindex" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "noindex" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PostCategory" ADD COLUMN "noindex" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "noindex" BOOLEAN NOT NULL DEFAULT false;
