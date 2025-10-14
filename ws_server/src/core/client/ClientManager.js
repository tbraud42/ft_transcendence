import {Client} from "./Client.js";

export class ClientManager {
    constructor() {
        this.clients = new Map();
    }

    createClient(
        socket,
        auth,
        id,
        username,
        token
    ) {
        let client
        if (this.clients.has(id)) {
            client = this.clients.get(id);
            client.socket = socket;
            client.connected = true;
            client.username = username;
            client.token = token;
        } else {
            client = new Client(
                socket,
                auth,
                id,
                username,
                token)
            this.clients.set(id, client);
        }
        return client;
    }
}