import { send } from "../utils/helpers.js";

export default function LeaveRoomHandler(ctx, ws) {
    const { roomManager } = ctx;
    const userId = ws._auth?.userId;
    const roomId = ws._roomId;

    if (roomId) {
        roomManager.leave(ws);
        send(ws, "left_room", { roomId });
        roomManager.broadcast(roomId, { type: "room_player_left", data: { userId } }, { except: ws });
    } else {
        send(ws, "left_room", { roomId: null });
    }
}