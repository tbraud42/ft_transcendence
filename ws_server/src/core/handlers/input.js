/**
 * Handles player input messages. (up/down)
 * @param msg { type: number, up: boolean, down: boolean }
 * @param socket The socket connection that sent the message.
 */
export default function handleInput(msg, socket) {
    const client = socket.__client
    if (!client?.auth || !client.tournament) {
        return;
    }
    client.setInput(!!msg.up, !!msg.down);
}
