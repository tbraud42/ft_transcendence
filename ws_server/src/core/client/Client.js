import { getTournamentManager } from '../game/GamesManager.js'

export class Client {
    constructor(socket) {
        this.socket = socket
        this.username = null
        this.token = null
        this.auth = false

        // session state
        this.tournament = null
        this.roomId = null
        this.slot = null
    }

    send(obj) {
        try {
            this.socket.send(JSON.stringify(obj)) 
        } catch {}
    }

    attachToTournament(t) {
        this.tournament = t
    }

    detachFromTournament() {
        this.tournament = null
        this.roomId = null
        this.slot = null
    }

    onDisconnect() {
        if (this.tournament) {
            this.tournament.markDisconnected(this.username)
        }
    }
}