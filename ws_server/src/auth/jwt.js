import jwt from "jsonwebtoken";

export function extractTokenFromRequest(req, { header = "authorization", queryParam = "token", subprotocol = "jwt" } = {}) {
    const auth = req.headers[header];
    if (auth && typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
        return auth.slice(7).trim();
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const qToken = url.searchParams.get(queryParam);
    if (qToken) return qToken;

    const proto = req.headers["sec-websocket-protocol"];
    if (proto && typeof proto === "string") {
        const parts = proto.split(",").map(s => s.trim());
        const i = parts.findIndex(p => p === subprotocol);
        if (i !== -1) {
            const maybeToken = parts[i + 1];
            if (maybeToken) return maybeToken;
        }
    }
    return null;
}

export function verifyJWT(token) {
    const secret = process.env.JWT_SECRET;
    try {
        const payload = jwt.verify(token, secret);
        if (!payload || !payload.sub) return { ok: false, error: "invalid_token_payload" };
        return { ok: true, payload };
    } catch {
        return { ok: false, error: "invalid_token" };
    }
}