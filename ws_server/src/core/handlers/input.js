export default {
    type: 'input',
    requiresAuth: true,

    /**
     * @param {{ up?: any, down?: any }} msg
     * @param {import('../client/Client.js').default} client
     */
    handle(msg, client) {
        const tournament = client.tournament;
        if (!tournament) {
            client.send({ type: 'error', error: 'tournament_not_found' });
            return;
        }

        let roomId
        let slot

        const assign = tournament.matches.get(client.username);
        if (assign) {
            roomId = assign.roomId;
            slot = assign.slot;
            client.roomId = roomId;
            client.slot = slot;
        }

        if (!roomId || slot == null) {
            client.send({ type: 'error', error: 'not_assigned' });
            return;
        }

        const room = tournament.rooms.get(roomId);
        if (!room) {
            client.send({ type: 'error', error: 'room_not_found' });
            return;
        }

        const up = !!msg?.up;
        const down = !!msg?.down;

        if (slot === 0) {
            room.inputs.up1 = up;
            room.inputs.down1 = down;
        } else {
            room.inputs.up2 = up;
            room.inputs.down2 = down;
        }
    },
}