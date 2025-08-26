import { send, sendError } from "../utils/helpers.js";

export default function SetRoomPrivacyHandler(ctx, ws, data) {
    const { roomManager } = ctx;
    const userId = ws._auth?.userId;
    const roomId = String(data?.roomId || "");
    const privacy = String(data?.privacy || "").toLowerCase();

    if (!userId) return sendError(ws, "unauthorized");
    if (!roomId) return sendError(ws, "invalid_room_id");
    if (!["public","private"].includes(privacy)) return sendError(ws, "invalid_privacy");

    const room = roomManager.get(roomId);
    if (!room) return sendError(ws, "room_not_found");
    if (room.creatorId !== String(userId)) return sendError(ws, "forbidden");

    room.privacy = privacy;
    send(ws, "room_updated", { room });
    roomManager.broadcast(room.id, { type: "room_updated", data: { room } }, { except: ws });
}