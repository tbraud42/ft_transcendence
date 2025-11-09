/**
 * Handle adding a bot to a tournament room.
 * @param msg { type: number, roomId: string, slot: 'p1' | 'p2' }
 * @param socket The socket connection that sent the message.
 */
export default function handleAddBot(msg, socket) {
    const t = socket.__client?.tournament;
    if (!t) {
        return;
    }

    const isOwner =
        (socket.__client?.id != null && t.creator?.id === socket.__client.id) ||
        (socket.__client?.username && t.creator?.username === socket.__client.username);
    if (!isOwner) {
        return;
    }

    const roomIdx = msg?.roomId;
    if (typeof roomIdx !== 'string' || roomIdx.length === 0) {
        return;
    }

    const slot = msg?.slot;
    if (slot !== 'p1' && slot !== 'p2') {
        return;
    }

    t.addBotAt(roomIdx, slot);
}
