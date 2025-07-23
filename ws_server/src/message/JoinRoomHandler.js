import {connectionManager, roomManager} from "../server.js";

export function JoinRoomHandler(ws, msg, payload) {
    if (!msg.id) {
        ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Room ID is required' }));
        return;
    }

    const user = connectionManager.getUser(ws);
    const room = roomManager.getRoomById(msg.id);
    if (!room) {
        ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Room not found' }));
        return;
    }

    if (room.getClientById(user.id)) {
        ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'You are already in this room' }));
        return;
    }

    if (room.isFull()) {
        ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Room is full' }));
        return;
    }

    room.addClient(user);
    ws.send(JSON.stringify({ type: 'join_room', success: true, room: room.toJSON() }));
}
