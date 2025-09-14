export default function handleReady(msg, socket) {
    const c = socket.__client
    if (!c?.auth || !c.tournament) {
        return
    }
    const room = c.tournament.findRoomByPlayer(c.username)
    if (!room) {
        return
    }
    room.markReady(c.username)
}