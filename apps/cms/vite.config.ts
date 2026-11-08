import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // start.cmd lan đặt LAN_HOST để máy khác trong mạng mở được CMS
  server: { port: 3001, strictPort: true, host: process.env.LAN_HOST ? true : undefined },
});
