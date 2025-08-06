import {roomManager} from "../../server.js";

export class Room {
    constructor(id, name, creatorId, difficulty = "medium", maxPlayers = 2, isPrivate = false) {
        this.id = id;
        this.name = name;
        this.creatorId = creatorId;
        this.difficulty = difficulty;
        this.maxPlayers = maxPlayers;
        this.private = isPrivate;
        this.clients = new Set();
        this.createdAt = Date.now();
        this.maxClients = 2;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            creatorId: this.creatorId,
            difficulty: this.difficulty,
            maxPlayers: this.maxPlayers,
            isPrivate: this.private,
            createdAt: this.createdAt,
            clientCount: this.getClientCount(),
        };
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getCreatorId() {
        return this.creatorId;
    }

    getDifficulty() {
        return this.difficulty;
    }

    isPrivate() {
        return this.private;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    addClient(client) {
        if (this.getClientCount() > this.maxClients) {
            throw new Error('Room is full');
        }
        this.clients.add(client);
        this.broadcast(
            JSON.stringify({
                type: 'join',
                client: {
                    id: client.id,
                    name: client.name,
                },
                room: this.toJSON(),
            }),
            client
        )
        console.log("Client added to room:", this.id, "Client ID:", client.id);
        client.ws.on('message', (raw) => {
            const message = JSON.parse(raw);
            if (message.type === 'leave') {
                this.removeClient(client);
                client.ws.close();
            } else {
                this.broadcast(raw, client);
            }
        })
    }

    removeClient(client) {
        this.clients.delete(client);
        if (this.getClientCount() === 0) {
            roomManager.removeRoomById(this.id);
        }
    }

    getClientById(clientId) {
        for (const client of this.clients) {
            if (client.id === clientId) {
                return client;
            }
        }
        return null;
    }

    getClientCount() {
        return this.clients.size;
    }

    isFull() {
        return this.getClientCount() >= this.maxClients;
    }

    broadcast(message, excludeClient = null) {
        for (const client of this.clients) {
            if (client === excludeClient) {
                continue;
            }
            if (client.readyState === client.OPEN) {
                client.ws.send(message);
            }
        }
    }
}