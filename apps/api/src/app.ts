import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./env.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { accountRouter } from "./modules/account/account.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { blogRouter } from "./modules/blog/blog.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS }));
app.use(express.json({ limit: "200kb" }));

// Kiểm cả database để giám sát biết khi nào API sống mà không đọc được dữ liệu
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "database_unavailable" });
  }
});

app.use("/api/v1", catalogRouter);
app.use("/api/v1", blogRouter);
app.use("/api/v1", ordersRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);
