export default function handleReady(msg, socket) {
    const client = socket.__client
    if (!client?.auth || !client.tournament) {
        return
    }
    client.setReady(!!msg?.ready)
}
