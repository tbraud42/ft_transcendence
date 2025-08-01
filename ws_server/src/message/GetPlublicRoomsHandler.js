import { roomManager } from "../server.js";

export function GetPubicRoomsHandler(ws, msg, payload) {
    if (!msg.name || !msg.creatorId) {
        return;
    }

    const rooms = roomManager.listPublicRooms();
    if (rooms.length === 0) {
        ws.send(JSON.stringify({
            type: 'get_public_rooms',
            success: false,
            message: 'No public rooms available'
        }));
        return;
    }
    ws.send(JSON.stringify({
        type: 'get_public_rooms',
        success: true,
        rooms: rooms.map(room => ({
            id: room.id,
            name: room.name,
            creatorId: room.creatorId,
            players: room.players.map(player => ({
                id: player.id,
                name: player.name
            })),
            isPrivate: room.isPrivate
        }))
    }));
}
