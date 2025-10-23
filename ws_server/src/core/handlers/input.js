export default function handleInput(msg, socket) {
    const client = socket.__client
    if (!client?.auth || !client.tournament) {
        return;
    }
    client.setInput(!!msg.up, !!msg.down);
}
