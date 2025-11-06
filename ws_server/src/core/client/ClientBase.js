export class ClientBase {
    /**
     * Base client (human or bot): connection/session state and paddle state.
     */
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

        // paddle params (overridden on attachToRoom)
        this.speed = 6;
        this.padWidth = 10;
        this.padHeight = 100;
    }

    /**
     * Transport hook to send a message to the client implementation.
     */
    send(_msg) {}

    /**
     * Return the current username.
     */
    getUsername() {
        return this.username;
    }

    /* ---------- tournament lifecycle ---------- */

    /**
     * Attach to a tournament; ensures presence and broadcasts snapshot.
     */
    attachToTournament(tournament) {
        this.tournament = tournament;
        if (tournament.getPlayerByUsername(this.username)) {
            tournament.broadcastSnapshot();
        } else if (!tournament.addPlayer(this)) {
            this.tournament = null;
            return false;
        }
        return true;

    }

    /**
     * Get the currently attached tournament (if any).
     */
    getTournament() {
        return this.tournament;
    }

    /**
     * Detach from tournament and room, and remove from participants.
     */
    detachTournament() {
        this.detachRoom();
        if (this.tournament) {
            this.tournament.participants.delete(this.getUsername());
            this.tournament = null;
        }
    }

    /* ---------- room lifecycle ---------- */

    /**
     * Attach to a room, reset readiness, sync paddle params, and center vertically.
     */
    attachToRoom(room) {
        if (!this.tournament) {
            return;
        }
        this.room = room;
        this.ready = false;

        // sync paddle/arena params from room
        this.padWidth  = room.PAD_W ?? this.padWidth;
        this.padHeight = room.PAD_H ?? this.padHeight;
        this.speed     = room.PAD_SPEED ?? this.speed;

        // center vertically
        this.y = Math.max(0, Math.min((room.H - this.padHeight) / 2, room.H - this.padHeight));
    }

    /**
     * Detach from the current room and inform the room.
     */
    detachRoom() {
        if (!this.room) {
            return;
        }
        this.room.removePlayer(this.getUsername());
        this.room = null;
    }

    /**
     * Get the currently attached room (if any).
     */
    getRoom() {
        return this.room;
    }

    /* ---------- connection/ready ---------- */

    /**
     * Mark the client as disconnected and trigger a snapshot.
     */
    onDisconnect() {
        this.tournament.remove(this.username);
    }

    /**
     * Authentication flag accessor.
     */
    isAuthenticated() {
        return !!this.auth;
    }

    /**
     * Connection status accessor.
     */
    isConnected() {
        return !!this.connected;
    }

    /**
     * Readiness accessor (bots are always ready).
     */
    isReady() {
        return (!!this.ready || this.isBot());
    }

    /**
     * Update readiness, broadcast, and try to start the room if applicable.
     */
    setReady(ready) {
        this.ready = !!ready;
        if (this.tournament) {
            this.tournament.broadcastSnapshot();
        }
        if (this.room) {
            this.room.checkStart();
        }
    }

    /**
     * Bot flag accessor.
     */
    isBot() {
        return !!this.bot;
    }

    /* ---------- helpers ---------- */

    /**
     * Get current paddle Y position.
     */
    getY() {
        return this.y;
    }

    /**
     * Get current score.
     */
    getScore() {
        return this.score;
    }

    /**
     * Increment score by 1.
     */
    incrementScore() {
        this.score += 1;
    }

    /**
     * Set absolute score value.
     */
    setScore(score) {
        this.score = score;
    }

    /**
     * Get paddle speed.
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Get paddle width.
     */
    getPadWidth() {
        return this.padWidth;
    }

    /**
     * Get paddle height.
     */
    getPadHeight() {
        return this.padHeight;
    }

    /**
     * Latch input flags coming from the network handler.
     */
    setInput(up, down) {
        this.up = !!up;
        this.down = !!down;
    }

    /**
     * Move paddle based on latched inputs and clamp inside the arena.
     * Call on each simulation tick.
     */
    tick(_ball) {
        const r = this.room;
        if (!r) {
            return;
        }

        let dy = 0;
        if (this.up && !this.down) {
            dy = -this.speed;
        } else if (this.down && !this.up) {
            dy = this.speed;
        }

        const maxY = (r.H ?? 0) - this.padHeight;
        this.y = Math.max(0, Math.min(maxY, this.y + dy));
    }
}