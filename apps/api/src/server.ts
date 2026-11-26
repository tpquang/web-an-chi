import { app } from "./app.js";
import { env } from "./env.js";

import { startJobs } from "./jobs.js";

// Production chỉ nghe trong máy: web gọi qua 127.0.0.1, CMS đi qua nginx (mun.<domain>/api/).
// Dev nghe mọi địa chỉ để máy khác trong mạng LAN mở được CMS
const host = env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0";

app.listen(env.PORT, host, () => {
  console.log(`API listening on http://${host === "0.0.0.0" ? "localhost" : host}:${env.PORT}`);
  startJobs();
});
