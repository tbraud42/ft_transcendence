export default function handleRemove(msg, socket) {
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

    const username = msg?.username;

    if (typeof username !== 'string' || username.length === 0) {
        return;
    }

    t.remove(username);
}
