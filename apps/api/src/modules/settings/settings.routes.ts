import { Router } from "express";
import { getStore } from "../../lib/store.js";

export const settingsRouter = Router();

settingsRouter.get("/store", async (_req, res) => {
  res.json({ data: await getStore() });
});
