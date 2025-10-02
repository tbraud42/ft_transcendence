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

    const a = msg?.addr;
    if (!a || (a.side !== 'left' && a.side !== 'right')) {
        return;
    }
    if (a.pos !== 'top' && a.pos !== 'bottom') {
        return;
    }
    if (typeof a.pair !== 'number' || a.pair < 0) {
        return;
    }

    t.addBotAt(a);
}
