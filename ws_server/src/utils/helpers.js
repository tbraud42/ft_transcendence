export function safeJSONParse(s) {
    try { return JSON.parse(s); } catch { return null; }
}
export function send(ws, type, data = undefined) {
    const payload = data === undefined ? { type } : { type, data };
    if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}
export function sendError(ws, code, extra = {}) {
    send(ws, "error", { code, ...extra });
}