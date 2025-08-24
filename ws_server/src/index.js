import { createServer } from "http";
import { loadEnv } from "./config.js";
import { attachWebSocket } from "./wsServer.js";
import { logger } from "./utils/logger.js";

loadEnv();

const httpServer = createServer((req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
    }
    res.writeHead(404);
    res.end();
});

attachWebSocket(httpServer);

httpServer.listen(3000, () => {
    logger.info(`HTTP + WS server listening on :3000`);
});