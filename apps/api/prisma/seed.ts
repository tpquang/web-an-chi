import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  PublishStatus,
} from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";

// Toàn bộ dữ liệu giả nằm trong sample-data.json, file này chỉ nạp vào database.
// Chạy lại nhiều lần được: bản ghi tìm theo slug, số điện thoại, mã đơn.
type SampleData = {
  store: Record<string, unknown>;
  categories: { name: string; slug: string; description?: string; guide?: string; position?: number; metaTitle?: string; metaDescription?: string }[];
  products: ({ category: string; specs?: { label: string; value: string }[] } & Record<string, unknown> & {
      name: string;
      slug: string;
      priceVnd: number;
      stock: number;
    })[];
  postCategories: { name: string; slug: string; description?: string; position?: number }[];
  posts: { title: string; slug: string; featured?: boolean; category: string; authorName: string; publishedAt: string; excerpt?: string; metaDescription?: string; content: string; products?: string[] }[];
  customers: { name: string; phone: string; email?: string; address?: string; marketingConsent?: boolean; password?: string }[];
  orders: {
    code: string;
    customerPhone: string;
    createdAt: string;
    paymentMethod: keyof typeof PaymentMethod;
    paymentStatus: keyof typeof PaymentStatus;
    status: keyof typeof OrderStatus;
    note?: string;
    items: { product: string; quantity: number }[];
  }[];
  beads: { name: string; slug: string; kind: "BEAD" | "CHARM"; material: string; sizeMm: number; priceVnd: number; stock: number; color: string; finish: string; note?: string; position: number }[];
};

const sample: SampleData = JSON.parse(readFileSync(new URL("./sample-data.json", import.meta.url), "utf8"));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function shippingFee(subtotal: number) {
  const { flatFeeVnd, freeFromVnd } = (sample.store as { shipping: { flatFeeVnd: number; freeFromVnd: number | null } }).shipping;
  return freeFromVnd !== null && subtotal >= freeFromVnd ? 0 : flatFeeVnd;
}

async function main() {
  await prisma.setting.upsert({
    where: { key: "store" },
    update: { value: sample.store as object },
    create: { key: "store", value: sample.store as object },
  });

  const categoryIds = new Map<string, string>();
  for (const category of sample.categories) {
    const { id } = await prisma.category.upsert({ where: { slug: category.slug }, update: category, create: category });
    categoryIds.set(category.slug, id);
  }

  const products = new Map<string, { id: string; name: string; priceVnd: number }>();
  for (const { category, ...product } of sample.products) {
    const data = { ...product, categoryId: categoryIds.get(category)!, status: PublishStatus.PUBLISHED };
    const saved = await prisma.product.upsert({ where: { slug: product.slug }, update: data, create: data });
    products.set(saved.slug, saved);
  }

  const postCategoryIds = new Map<string, string>();
  for (const category of sample.postCategories) {
    const { id } = await prisma.postCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
    postCategoryIds.set(category.slug, id);
  }

  for (const { category, products: related = [], publishedAt, ...post } of sample.posts) {
    const data = {
      ...post,
      publishedAt: new Date(publishedAt),
      status: PublishStatus.PUBLISHED,
      categoryId: postCategoryIds.get(category)!,
      products: { set: related.map((slug) => ({ id: products.get(slug)!.id })) },
    };
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: data,
      create: { ...data, products: { connect: data.products.set } },
    });
  }

  const customerIds = new Map<string, { id: string; name: string; email: string | null; address: string | null }>();
  for (const { password, ...customer } of sample.customers) {
    const data = { ...customer, passwordHash: password ? await hashPassword(password) : null };
    const saved = await prisma.customer.upsert({ where: { phone: customer.phone }, update: data, create: data });
    customerIds.set(saved.phone, saved);
  }

  // Đơn mẫu không trừ tồn kho: tồn kho trong JSON đã là số sau khi bán
  for (const order of sample.orders) {
    const customer = customerIds.get(order.customerPhone)!;
    const items = order.items.map(({ product, quantity }) => {
      const found = products.get(product)!;
      return { productId: found.id, productName: found.name, unitPriceVnd: found.priceVnd, quantity };
    });
    const subtotalVnd = items.reduce((sum, item) => sum + item.unitPriceVnd * item.quantity, 0);
    const shippingVnd = shippingFee(subtotalVnd);
    const data = {
      customerName: customer.name,
      customerPhone: order.customerPhone,
      customerEmail: customer.email,
      address: customer.address ?? "",
      note: order.note ?? null,
      subtotalVnd,
      shippingVnd,
      totalVnd: subtotalVnd + shippingVnd,
      paymentMethod: PaymentMethod[order.paymentMethod],
      paymentStatus: PaymentStatus[order.paymentStatus],
      status: OrderStatus[order.status],
      customerId: customer.id,
      createdAt: new Date(order.createdAt),
    };
    await prisma.order.upsert({
      where: { code: order.code },
      update: { ...data, items: { deleteMany: {}, create: items } },
      create: { ...data, code: order.code, items: { create: items } },
    });
  }

  for (const bead of sample.beads) {
    await prisma.bead.upsert({ where: { slug: bead.slug }, update: bead, create: bead });
  }

  console.log(
    `Seed xong: ${sample.beads.length} loại hạt, ${sample.categories.length} danh mục, ${sample.products.length} sản phẩm, ` +
      `${sample.postCategories.length} chủ đề, ${sample.posts.length} bài viết, ` +
      `${sample.customers.length} khách hàng, ${sample.orders.length} đơn hàng.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
