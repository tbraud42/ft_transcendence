import { WebSocketServer } from "ws";
import { CONFIG } from "./config.js";
import { extractTokenFromRequest, verifyJWT } from "./auth/jwt.js";
import { logger } from "./utils/logger.js";
import { send } from "./utils/helpers.js";
import { handlers } from "./handlers/index.js";
import { RoomManager } from "./rooms/RoomManager.js";

const roomManager = new RoomManager();
const ctx = { roomManager };

export function attachWebSocket(httpServer) {
    const wss = new WebSocketServer({
        noServer: true,
        handleProtocols: (protocols /* string[] */, request) => {
            return protocols.includes(CONFIG.tokenSubprotocol) ? CONFIG.tokenSubprotocol : false;
        }
    });

    // Auth JWT à l'upgrade
    httpServer.on("upgrade", (req, socket, head) => {
        const token = extractTokenFromRequest(req, {
            header: CONFIG.tokenHeader,
            queryParam: CONFIG.tokenQueryParam,
            subprotocol: CONFIG.tokenSubprotocol
        });

        if (!token) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        const v = verifyJWT(token);
        if (!v.ok) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
        req._jwtPayload = v.payload;

        // Laisse ws sélectionner/écrire "Sec-WebSocket-Protocol: jwt"
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    });

    wss.on("connection", (ws, req) => {
        const payload = req._jwtPayload;
        ws._auth = {
            userId: String(payload.sub),
            claims: payload
        };

        ws.isAlive = true;
        ws.on("pong", () => (ws.isAlive = true));

        logger.info(`WS connected uid=${ws._auth.userId}`);

        // Bienvenue + rooms publiques
        send(ws, "welcome", {
            userId: ws._auth.userId,
            rooms: roomManager.listRooms()
        });

        ws.on("message", (raw) => {
            const text = typeof raw === "string" ? raw : raw.toString("utf8");
            let msg;
            try { msg = JSON.parse(text); } catch { return; }
            if (!msg || typeof msg.type !== "string") return;

            const h = handlers.get(msg.type);
            if (!h) return; // types inconnus ignorés (sécurité)
            try { h(ctx, ws, msg.data); }
            catch (e) { logger.error("handler error", e?.message || e); }
        });

        ws.on("close", () => {
            roomManager.handleDisconnect(ws);
            logger.info(`WS closed uid=${ws._auth?.userId}`);
        });

        ws.on("error", (err) => logger.warn("WS error", err?.message || err));
    });

    // Heartbeat
    const interval = setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) { ws.terminate(); continue; }
            ws.isAlive = false;
            try { ws.ping(); } catch {}
        }
    }, CONFIG.heartbeatMs);

    wss.on("close", () => clearInterval(interval));
}