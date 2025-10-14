import { SrvMessageType } from '../client/protocol.js';

export class Room {
    constructor({ tournament, id, difficulty, tickRate = 20 }) {
        this.tournament = tournament;
        this.difficulty = difficulty;
        this.id = id;

        // store usernames (not objects)
        this.p1 = null;
        this.p2 = null;

        this.tickRate = tickRate;
        this.loop = null;
        this.started = false; // broadcasting started

        // world
        this.W = 640;
        this.H = 480;
        this.PAD_W = 10;
        this.PAD_H = 100;
        this.PAD_SPEED = 5;
        this.BALL_R = 16;

        // minimal state; keys will be usernames
        this.state = {
            tick: 0,
            score: {},
            paddles: {},
            ball: { x: this.W / 2, y: this.H / 2 },
        };
    }

    /* ---------------- player slots (by position) ---------------- */

    getPlayerByPosition(pos) {
        if (pos === 1) {
            return this.p1;
        }
        if (pos === 2) {
            return this.p2;
        }
        return null;
    }

    getPlayerByUsername(username) {
        if (this.p1.getUsername() === username) {
            return this.p1;
        }
        if (this.p2.getUsername() === username) {
            return this.p2;
        }
        return null;
    }

    removePlayer(username) {
        const u = String(username || '');
        if (this.p1 === u) {
            this.p1 = null;
        }
        if (this.p2 === u) {
            this.p2 = null;
        }
        this._rebuildStateKeys();

        // stop broadcasting if one leaves
        if (this.loop && (!this.p1 || !this.p2)) {
            clearInterval(this.loop);
            this.loop = null;
            this.started = false;
        }
    }

    getPlayers() {
        return [this.p1, this.p2].filter(Boolean);
    }

    checkStart() {
        if (!this.p1 || !this.p2) {
            return false;
        }
        if (this.p1.isReady() && this.p2.isReady()) {
            this._broadcast({
                type: SrvMessageType.MATCH_START, roomId: this.id, clients: [
                    {
                        username: this.p1.getUsername(),
                        slot: 0
                    },
                    {
                        username: this.p2.getUsername(),
                        slot: 1
                    },
                ],
                difficulty: this.difficulty
            });
            //this._broadcast(this._publicState());
            //this._rebuildStateKeys();
            this._startBroadcast();
            return true;
        }
        return false;
    }

    applyInput(username, up, down) {
        const player = this.getPlayerByUsername(username);
        player.up = up;
        player.down = down;
    }

    /* ---------------- broadcast loop (idle) ---------------- */

    _startBroadcast() {
        if (this.started) {
            return;
        }
        if (!this.p1 || !this.p2) {
            return;
        }

        const intervalMs = Math.max(16, Math.round(1000 / this.tickRate));
        this.started = true;
        this.loop = setInterval(() => {
            try {
                this._tick();
                this._broadcast(this._publicState());
            } catch (e) {
                clearInterval(this.loop);
                this.loop = null;
                this.started = false;
                // Keep it minimal: we only broadcast state, no match end logic here
            }
        }, intervalMs);
    }

    _tick() {
        this.state.tick += 1;
        this.p1.tick(); //TODO: give ball for ai
        this.p2.tick(); //TODO: give ball for ai
        // no physics; just time passing so clients can draw the court
        // update player pos depending on up or down
        // update ball movement
    }

    _publicState() {
        const u1 = this.p1.getUsername();
        const u2 = this.p2.getUsername();

        return {
            type: SrvMessageType.MATCH_STATE,
            roomId: this.id,
            tick: this.state.tick | 0,
            players: [
                {
                    username: u1,
                    score: this.state.score[u1] || 0,
                    y: this.p1.y,
                    pad: { width: this.PAD_W, height: this.PAD_H, speed: this.PAD_SPEED },
                },
                {
                    username: u2,
                    score: this.state.score[u2] || 0,
                    y: this.p2.y,
                    pad: { width: this.PAD_W, height: this.PAD_H, speed: this.PAD_SPEED },
                },
            ],
            ball: {
                x: this.state.ball.x,
                y: this.state.ball.y,
                radius: this.BALL_R,
            },
            size: { w: this.W, h: this.H },
        };
    }

    _rebuildStateKeys() {
        const u1 = this.p1, u2 = this.p2;

        const paddles = {};
        const score = {};

        if (u1) {
            paddles[u1] = { x: 24, y: this.H / 2 - this.PAD_H / 2, vy: 0 };
            score[u1] = this.state.score[u1] || 0;
        }
        if (u2) {
            paddles[u2] = { x: this.W - 24 - this.PAD_W, y: this.H / 2 - this.PAD_H / 2, vy: 0 };
            score[u2] = this.state.score[u2] || 0;
        }

        this.state.paddles = paddles;
        this.state.score = score;

        this.state.ball = { x: this.W / 2, y: this.H / 2 };
    }

    _broadcast(msg) {
        if (this.p1) {
            this.p1.send(msg);
        }
        if (this.p2) {
            this.p2.send(msg);
        }
    }
}