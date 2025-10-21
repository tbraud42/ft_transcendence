export class ClientBase {
    constructor(id, username) {
        this.auth = false;
        this.id = id;
        this.username = username;
        this.connected = true;
        this.ready = false;
        this.bot = false;

        // session
        this.tournament = null;
        this.room = null;

        // inputs/state for game
        this.up = false;
        this.down = false;
        this.y = 0;
        this.score = 0;

        // paddle params (filled on attachToRoom)
        this.speed = 6;
        this.padWidth = 10;
        this.padHeight = 100;
    }

    send(_msg) {}

    getUsername() {
        return this.username; 
    }

    /* ---------- tournament lifecycle ---------- */

    attachToTournament(tournament) {
        this.tournament = tournament;
        if (tournament.getPlayerByUsername(this.username)) {
            tournament.broadcastSnapshot();
        } else if (!tournament.addPlayer(this)) {
            this.tournament = null;
        }
    }

    detachTournament() {
        this.tournament = null;
        this.setReady(false);
        this.detachRoom();
    }

    /* ---------- room lifecycle ---------- */

    attachToRoom(room) {
        if (!this.tournament) {
            return;
        }
        this.room = room;

        // sync paddle/arena params from room
        this.padWidth  = room.PAD_W ?? this.padWidth;
        this.padHeight = room.PAD_H ?? this.padHeight;
        this.speed     = room.PAD_SPEED ?? this.speed;

        // center vertically
        this.y = Math.max(0, Math.min((room.H - this.padHeight) / 2, room.H - this.padHeight));
    }

    detachRoom() {
        this.room = null; 
    }
    getRoom() {
        return this.room; 
    }

    /* ---------- connection/ready ---------- */

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
        this.ready = !!ready;
        if (this.tournament) {
            this.tournament.broadcastSnapshot();
        }
        if (this.room) {
            this.room.checkStart?.();
        }
    }

    isBot() {
        return !!this.bot; 
    }

    /* ---------- helpers ---------- */

    getY() {
        return this.y; 
    }
    getScore() {
        return this.score; 
    }
    getSpeed() {
        return this.speed; 
    }
    getPadWidth() {
        return this.padWidth; 
    }
    getPadHeight() {
        return this.padHeight; 
    }

    setInput(up, down) {
        // simple input latch; server calls this from input handler
        this.up = !!up;
        this.down = !!down;
    }

    /**
     * Move paddle according to input flags. Call every tick.
     * @param _ball (unused for now)
     */
    tick(_ball) {
        const r = this.room;
        if (!r) {
            return;
        }

        // up -> decrease y ; down -> increase y
        let dy = 0;
        if (this.up && !this.down) {
            dy = -this.speed;
        } else if (this.down && !this.up) {
            dy = this.speed;
        }

        // clamp inside arena
        const maxY = (r.H ?? 0) - this.padHeight;
        this.y = Math.max(0, Math.min(maxY, this.y + dy));
    }
}