import type { OrderStatus, PaymentMethod, PaymentStatus, PublishStatus } from "./labels";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  guide?: string | null;
  position: number;
  metaTitle: string | null;
  metaDescription: string | null;
  _count?: { products?: number; posts?: number };
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  priceVnd: number;
  stock: number;
  status: PublishStatus;
  featured: boolean;
  updatedAt: string;
  category: { name: string };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  usage: string | null;
  specs: { label: string; value: string }[] | null;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  stock: number;
  origin: string | null;
  featured: boolean;
  shopeeUrl: string | null;
  tiktokUrl: string | null;
  status: PublishStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string;
  images: { url: string; alt: string | null }[];
};

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
  authorName: string;
  category: { name: string };
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  authorName: string;
  status: PublishStatus;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string;
  productIds: string[];
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  marketingConsent: boolean;
  createdAt: string;
  spentVnd: number;
  lastOrderAt: string | null;
  _count: { orders: number };
};

export type OrderRow = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  totalVnd: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  _count: { items: number };
};

export type Order = OrderRow & {
  customerEmail: string | null;
  address: string;
  note: string | null;
  subtotalVnd: number;
  shippingVnd: number;
  customerId: string | null;
  items: { id: string; productName: string; unitPriceVnd: number; quantity: number; product: { slug: string } | null }[];
};

export type Customer = Omit<CustomerRow, "spentVnd" | "lastOrderAt" | "_count"> & { orders: OrderRow[] };
