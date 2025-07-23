export class Room {
    constructor(id, name, creatorId, difficulty = "medium", isPrivate = false) {
        this.id = id;
        this.name = name;
        this.creatorId = creatorId;
        this.difficulty = difficulty;
        this.private = isPrivate;
        this.clients = new Set();
        this.createdAt = Date.now();
        this.maxClients = 2;
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
        this.clients.add(client);
        client.ws.on('message', (raw) => {
            const message = JSON.parse(raw);
            if (message.type === 'leave') {
                this.removeClient(client);
                client.ws.close();
            } else {
                this.broadcast(raw);
            }
        })
    }

    removeClient(client) {
        this.clients.delete(client);
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

    broadcast(message) {
        for (const client of this.clients) {
            if (client.readyState === client.OPEN) {
                client.send(message);
            }
        }
    }
}