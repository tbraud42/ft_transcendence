const rooms = []

export function registerRoom(room) {
    rooms.push(room)
}

export function removeRoom(roomId) {
    const index = rooms.findIndex(r => r.id === roomId)
    if (index === -1) {
        return false
    }
    rooms.splice(index, 1)
    return true
}

export function getPublicRooms() {
    return rooms.filter(r => !r.isPrivate)
}
