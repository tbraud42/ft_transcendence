/**
 * Handle ready message, set client ready state.
 *
 * @param msg {type: number, ready: boolean}
 * @param socket The socket connection that sent the message.
 */
export default function handleReady(msg, socket) {
    const client = socket.__client
    if (!client?.auth || !client.tournament) {
        return
    }
    client.setReady(!!msg?.ready)
}
