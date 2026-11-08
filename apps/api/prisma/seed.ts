import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { receiveBatch } from "../src/lib/receive.js";
import { syncCustomPrices } from "../src/lib/stock.js";
import { BatchStatus, MaterialGroup, MaterialKind, PrismaClient, ProductType, PublishStatus } from "../src/generated/prisma/client.js";

// Dữ liệu ban đầu (mặc định khi cài server lần đầu) nằm trong sample-data.json, file này chỉ nạp vào database.
// Chạy lại nhiều lần được: bản ghi tìm theo slug hoặc tên.
//
// Luồng hàng: đợt nhập đưa nguyên liệu (bao bì, vòng hạt, nụ) vào kho, đóng gói theo công thức
// (ProductComponent) mới ra thành phẩm. Vì vậy sản phẩm seed với tồn kho 0.
//
// `npm run db:seed:initial` (deploy lần đầu) chỉ nạp khi database chưa có nguyên liệu, sản phẩm.
// `npm run db:seed:reset` xoá sạch sản phẩm, đơn hàng, kho, đợt nhập, hạt trước khi seed.
// Bài viết, chủ đề bài viết, danh mục, nhân viên giữ nguyên.
type SampleData = {
  store: Record<string, unknown>;
  categories: { name: string; slug: string; description?: string; guide?: string; position?: number; metaTitle?: string; metaDescription?: string }[];
  materials: { name: string; group: keyof typeof MaterialGroup; kind?: keyof typeof MaterialKind; beadMaterial?: string; unit: string; unitsPerKg?: number; markupPct?: number; note?: string }[];
  products: {
    name: string;
    slug: string;
    category: string;
    type: keyof typeof ProductType;
    status?: keyof typeof PublishStatus;
    summary?: string;
    priceVnd: number;
    stock: number;
    specs?: { label: string; value: string }[];
    components: { material: string; quantity: number }[];
  }[];
  postCategories: { name: string; slug: string; description?: string; position?: number }[];
  posts: { title: string; slug: string; featured?: boolean; category: string; authorName: string; publishedAt: string; excerpt?: string; metaDescription?: string; content: string }[];
  batches: { name: string; supplier?: string; orderedAt?: string; note?: string; receive?: boolean; lines: { material: string; quantity: number; totalCostVnd: number }[] }[];
  beads: { name: string; slug: string; kind: "BEAD" | "CHARM"; material: string; sizeMm: number; priceVnd: number; color: string; finish: string; note?: string; position: number; active?: boolean; stockItem: string }[];
};

const sample: SampleData = JSON.parse(readFileSync(new URL("./sample-data.json", import.meta.url), "utf8"));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Thứ tự xoá theo khoá ngoại: sổ kho và đóng gói trước, sản phẩm và nguyên liệu sau
async function resetCatalog() {
  await prisma.$transaction([
    prisma.stockMovement.deleteMany(),
    prisma.packRun.deleteMany(),
    prisma.purchaseBatch.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productComponent.deleteMany(),
    prisma.product.deleteMany(),
    prisma.material.deleteMany(),
    prisma.bead.deleteMany(),
    // Dữ liệu khách: hội thoại (tin nhắn xoá theo) và hồ sơ khách
    prisma.conversation.deleteMany(),
    prisma.customer.deleteMany(),
  ]);
  console.log("Đã xoá sản phẩm, đơn hàng, nguyên liệu, đợt nhập, đóng gói, sổ kho, hạt, khách hàng, hội thoại.");
}

async function main() {
  if (process.argv.includes("--reset")) await resetCatalog();
  // Cài server lần đầu: chỉ nạp khi chưa có nguyên liệu và sản phẩm, để chạy lại deploy không ghi đè dữ liệu thật
  if (process.argv.includes("--initial") && ((await prisma.material.count()) > 0 || (await prisma.product.count()) > 0)) {
    console.log("Database đã có dữ liệu, bỏ qua dữ liệu ban đầu.");
    return;
  }

  // Thông tin cửa hàng chỉ tạo lần đầu, seed lại không ghi đè thông tin thật đã sửa
  await prisma.setting.upsert({
    where: { key: "store" },
    update: {},
    create: { key: "store", value: sample.store as object },
  });

  const categoryIds = new Map<string, string>();
  for (const category of sample.categories) {
    const { id } = await prisma.category.upsert({ where: { slug: category.slug }, update: category, create: category });
    categoryIds.set(category.slug, id);
  }

  const materialIds = new Map<string, string>();
  for (const { group, kind = "GENERAL", ...material } of sample.materials) {
    const data = { ...material, group: MaterialGroup[group], kind: MaterialKind[kind] };
    const { id } = await prisma.material.upsert({ where: { name: material.name }, update: data, create: data });
    materialIds.set(material.name, id);
  }

  for (const { category, components, type, status = "PUBLISHED", ...product } of sample.products) {
    const recipe = components.map(({ material, quantity }, position) => {
      const materialId = materialIds.get(material);
      if (!materialId) throw new Error(`Sản phẩm ${product.slug} dùng nguyên liệu chưa khai báo: ${material}`);
      return { materialId, quantity, position };
    });
    // Tồn kho chỉ tăng qua đóng gói, seed lại không ghi đè tồn kho đang có
    const { stock, ...data } = { ...product, type: ProductType[type], categoryId: categoryIds.get(category)!, status: PublishStatus[status] };
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...data, components: { deleteMany: {}, create: recipe } },
      create: { ...data, stock, components: { create: recipe } },
    });
  }

  const postCategoryIds = new Map<string, string>();
  for (const category of sample.postCategories) {
    const { id } = await prisma.postCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
    postCategoryIds.set(category.slug, id);
  }

  for (const { category, publishedAt, ...post } of sample.posts) {
    const data = { ...post, publishedAt: new Date(publishedAt), status: PublishStatus.PUBLISHED, categoryId: postCategoryIds.get(category)! };
    await prisma.post.upsert({ where: { slug: post.slug }, update: data, create: data });
  }

  // Hạt không có tồn kho riêng: tồn kho là của nguyên liệu gắn kèm
  for (const { stockItem, ...rest } of sample.beads) {
    const bead = { ...rest, materialId: materialIds.get(stockItem) ?? null };
    await prisma.bead.upsert({ where: { slug: bead.slug }, update: bead, create: bead });
  }
  await syncCustomPrices(prisma);

  // Hàng vào kho chỉ qua đợt nhập, nhập kho bằng đúng hàm CMS dùng. Đợt đã có (theo tên) thì bỏ qua,
  // nên seed lại không nhập kho hai lần
  for (const { lines, receive, orderedAt, ...batch } of sample.batches) {
    if (await prisma.purchaseBatch.findFirst({ where: { name: batch.name }, select: { id: true } })) continue;
    const created = await prisma.purchaseBatch.create({
      data: {
        ...batch,
        orderedAt: orderedAt ? new Date(`${orderedAt}T12:00:00+07:00`) : null,
        status: BatchStatus.ORDERED,
        lines: {
          create: lines.map(({ material, ...line }, position) => {
            const materialId = materialIds.get(material);
            if (!materialId) throw new Error(`Đợt nhập ${batch.name} có nguyên liệu chưa khai báo: ${material}`);
            return { ...line, materialId, position };
          }),
        },
      },
    });
    if (receive) await prisma.$transaction((tx) => receiveBatch(tx, created.id));
  }

  console.log(
    `Seed xong: ${sample.materials.length} nguyên liệu, ${sample.products.length} sản phẩm, ${sample.beads.length} loại hạt và charm, ${sample.batches.length} đợt nhập, ` +
      `${sample.categories.length} danh mục, ${sample.postCategories.length} chủ đề, ${sample.posts.length} bài viết.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
