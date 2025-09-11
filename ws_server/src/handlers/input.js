module.exports = {
    type: 'input',
    requiresAuth: true,

    handle(msg, { ws, send, rooms }) {
        const roomId = ws.meta?.roomId;
        const slot = ws.meta?.slot;
        if (!roomId || slot == null) {
            send(ws, { type: 'error', error: 'not_in_room' }); return; 
        }

        const room = rooms.get(roomId);
        if (!room) {
            send(ws, { type: 'error', error: 'room_not_found' }); return; 
        }

        const up = !!msg?.up;
        const down = !!msg?.down;

        room.inputs = room.inputs || { up1:false, down1:false, up2:false, down2:false };
        if (slot === 0) {
            room.inputs.up1 = up; room.inputs.down1 = down; 
        } else {
            room.inputs.up2 = up; room.inputs.down2 = down; 
        }
    },
};