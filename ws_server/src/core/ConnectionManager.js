export class ConnectionManager {
    constructor() {
        this.clients = new Map()
    }

    register(socket, client) {
        client.ws = socket
        this.clients.set(socket, client)
    }

    unregister(socket) {
        this.clients.delete(socket)
    }

    getUser(socket) {
        return this.clients.get(socket)
    }

    getSocketByUserId(userId) {
        for (const [socket, client] of this.clients.entries()) {
            if (client.id === userId) {
                return socket
            }
        }
        return null
    }
}