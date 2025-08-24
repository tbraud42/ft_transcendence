// type: "move"
// data: { dir: "up" | "down" | "stop" }

import { sendError } from "../utils/helpers.js";

export default function MoveHandler(ctx, ws, data) {
    const { roomManager } = ctx;
    const dir = String(data?.dir || "").toLowerCase();
    const res = roomManager.applyInput(ws, dir);
    if (!res.ok) return sendError(ws, res.error);
}