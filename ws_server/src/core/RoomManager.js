import {Room} from "./engine/Room.js";
import {config} from "../config.js";
import {connectionManager} from "../server.js";
import fetch from 'node-fetch';
import https from 'https'

export class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    async createRoom(id, creatorId) {
        if (this.rooms.has(id)) {
            throw new Error(`Room with id ${id} already exists`)
        }

        const token = connectionManager.getTokenByUserId(creatorId)
        const roomData = await this.getRoomDataThroughApi(id, token)

        const name = roomData.name || 'Pong'
        const difficulty = roomData.difficulty || "medium"
        const maxPlayers = roomData.maxPlayers || 2
        const isPrivate = roomData.isPrivate || false

        const room = new Room(id, name, creatorId, difficulty, maxPlayers, isPrivate)
        this.rooms.set(id, room)
        return room
    }

    getRoomById(id) {
        return this.rooms.get(id)
    }

    removeRoomById(id) {
        this.rooms.delete(id)
        //TODO: api call to delete the room
    }

    getRoomByClientId(clientId) {
        for (const room of this.rooms.values()) {
            if (room.getClients().some(client => client.id === clientId)) {
                return room
            }
        }
        return null
    }

    async getRoomDataThroughApi(roomId, userToken) {
        try {
            const url = `https://${config.API_URL}/tournaments/${roomId}`

            const agent = new https.Agent({
                rejectUnauthorized: config.NODE_ENV !== 'development',
            })

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                agent
            })

            const text = await response.text()

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`)
            }

            return JSON.parse(text)

        } catch (error) {
            console.error('Error fetching room data:', error)
            throw error
        }
    }
}