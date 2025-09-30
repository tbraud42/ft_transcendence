export default function handleInput(msg, socket) {
    const c = socket.__client
    if (!c?.auth || !c.tournament) {
        return
    }
    const room = c.tournament.findRoomByPlayer(c.username)
    if (!room) {
        return
    }
    room.applyInput(c.username, msg.input || {})
}