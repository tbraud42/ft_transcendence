export default function handleInput(msg, socket) {
    const client = socket.__client
    if (!client?.auth || !client.tournament) {
        return;
    }
    client.up = !!msg.up;
    client.down = !!msg.down;
}
