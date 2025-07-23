import {connectionManager, roomManager} from "../server.js";

export function CreateRoomHandler(ws, msg, payload) {
    if (!msg.name || !msg.creatorId) {
        return;
    }

    const room = roomManager.createRoom(msg.name, msg.creatorId, msg.difficulty || "medium", msg.isPrivate || false);
    ws.send(JSON.stringify({ type: 'create_room', success: true, room: room }));
}
