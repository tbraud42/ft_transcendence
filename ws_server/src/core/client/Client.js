import {ClientBase} from "./ClientBase.js";

export class Client extends ClientBase {
    constructor(socket, auth, id, username, token) {
        super(id, username);
        this.socket = socket
        this.auth = auth
        this.token = token
        this.bot = false;
    }

    send(obj) {
        try {
            this.socket.send(JSON.stringify(obj))
        } catch {}
    }
}