export class ClientBase {
    constructor(id, username) {
        this.auth = false
        this.id = id
        this.username = username
        this.connected = true
        this.ready = false
        this.bot = true;

        // session state
        this.tournament = null
        this.room = null

        // game status
        this.up = false;
        this.down = false;
        this.y = 0;
        this.score = 0;
    }

    send(msg) {}

    getUsername() {
        return this.username;
    }

    attachToTournament(tournament) {
        this.tournament = tournament;
        if (tournament.getPlayerByUsername(this.username)) {
            tournament.broadcastSnapshot();
        } else if (!tournament.addPlayer(this)) {
            this.tournament = null;
        }
    }

    detachTournament() {
        this.tournament = null
        this.setReady(false);
        this.detachRoom();
    }

    attachToRoom(room) {
        if (!this.tournament) {
            return
        }
        this.room = room
    }

    detachRoom() {
        this.room = null
    }

    getRoom() {
        return this.room
    }

    onDisconnect() {
        this.ready = false;
        this.connected = false;
        if (this.tournament) {
            this.tournament.broadcastSnapshot();
        }
    }

    isAuthenticated() {
        return !!this.auth;
    }

    isConnected() {
        return !!this.connected;
    }

    isReady() {
        return !!this.ready;
    }

    setReady(ready) {
        this.ready = ready;
        if (this.tournament) {
            this.tournament.broadcastSnapshot();
        }
        if (this.room) {
            this.room.checkStart();
        }
    }

    isBot() {
        return !!this.bot;
    }

    tick(ball) {
        if (!this.room) {
            return;
        }
        if (this.up && this.y < this.room.H) {
            this.y += 1;
        }
        if (this.down && this.y > 0) {
            this.y -= 1;
        }
        console.log(this.y)
    }
}