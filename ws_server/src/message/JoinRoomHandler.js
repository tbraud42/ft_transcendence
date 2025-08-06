import {connectionManager, roomManager} from "../server.js";

export function JoinRoomHandler(ws, msg, payload) {
    if (!msg.data.id) {
        ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Room ID is required' }));
        return;
    }

    const user = connectionManager.getUser(ws);
    let room = roomManager.getRoomById(msg.data.id);
    if (!room) {
        roomManager.createRoom(msg.data.id, user.id)
            .then(newRoom => {
                room = newRoom;
                if (room.isFull()) {
                    ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Room is full' }));
                    return;
                }
                room.addClient(user);
                ws.send(JSON.stringify({ type: 'join_room', success: true, room: room.toJSON() }));
            }
        ).catch(err => {
            console.error(`Error creating room: ${err.message}`);
            ws.send(JSON.stringify({ type: 'join_room', success: false, error: 'Failed to create room' }));
        });
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

    console.log("NEW USER JOINING ROOM:", room.id, "USER ID:", user.id);
    room.addClient(user);
    ws.send(JSON.stringify({ type: 'join_room', success: true, room: room.toJSON() }));
}
