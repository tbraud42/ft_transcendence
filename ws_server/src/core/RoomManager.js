import {Room} from "./engine/Room.js";

export class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(id, name, creatorId, difficulty = "medium", isPrivate = false) {
        if (this.rooms.has(id)) {
            throw new Error(`Room with id ${id} already exists`);
        }
        const room = new Room(id, name, creatorId, difficulty, isPrivate);
        this.rooms.set(id, room);
        return room;
    }

    getRoomById(id) {
        return this.rooms.get(id)
    }

    removeRoomById(id) {
        this.rooms.delete(id)
    }

    getRoomByClientId(clientId) {
        for (const room of this.rooms.values()) {
            if (room.getClients().some(client => client.id === clientId)) {
                return room
            }
        }
        return null
    }

    listPublicRooms() {
        return Array.from(this.rooms.values()).filter(r => !r.private)
    }
}