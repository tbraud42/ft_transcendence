import { SrvMessageType } from '../client/protocol.js';
import { Ball } from './Ball.js';

const WINNING_SCORE = 1;

export class Room {
    /**
     * Construct a game room bound to a tournament and identified by id.
     * Prepares world dimensions, physics objects, and initial state.
     */
    constructor({ tournament, id, difficulty, tickRate = 60 }) {
        this.tournament = tournament;
        this.difficulty = difficulty;
        this.id = id;

        this.p1 = null;
        this.p2 = null;

        this.tickRate = tickRate;
        this.loop = null;
        this.started = false;
        this.startTime = 0;
        this.totalTime = 0;
        this.ended = false;
        this.winnerUsername = null;
        this.winnerScore = 0;
        this.loserUsername = null;
        this.loserScore = 0;

        this.startDelayMs = 4000;
        this.countdownTimer = null;

        this.W = 640;
        this.H = 480;
        this.PAD_W = 10;
        this.PAD_H = 100;
        this.PAD_SPEED = 5;

        this.ball = new Ball(this.W / 2, this.H / 2, 8, this.W, this.H);

        this.state = {
            tick: 0,
            score: {},
            paddles: {},
        };
    }

    /**
     * Get player by absolute position: 1 -> p1, 2 -> p2, else null.
     */
    getPlayerByPosition(pos) {
        if (pos === 1) return this.p1;
        if (pos === 2) return this.p2;
        return null;
    }

    /**
     * Get player instance by username, or null if not present.
     */
    getPlayerByUsername(username) {
        if (this.p1?.getUsername() === username) return this.p1;
        if (this.p2?.getUsername() === username) return this.p2;
        return null;
    }

    /**
     * Remove a player from the room by username; stop countdown/loop as needed.
     */
    removePlayer(username) {
        if (!this.ended) {
            if (this.p1 && username === this.p1.getUsername()) {
                this.p1 = null;
            }
            if (this.p2 && username === this.p2.getUsername()) {
                this.p2 = null;
            }
        }

        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }

        if (this.loop && (!this.p1 || !this.p2)) {
            clearInterval(this.loop);
            this.loop = null;
            this.started = false;
        }
    }

    /**
     * Return an array of currently present players (filters nulls).
     */
    getPlayers() {
        return [this.p1, this.p2].filter(Boolean);
    }

    /**
     * If both players exist and are ready, announce start and kick off a countdown.
     * Cancels countdown if readiness changes.
     */
    checkStart() {
        if (!this.p1 || !this.p2) return false;

        if (this.p1.isReady() && this.p2.isReady()) {
            this._broadcast({
                type: SrvMessageType.MATCH_START,
                roomId: this.id,
                clients: [
                    { username: this.p1.getUsername(), slot: 0 },
                    { username: this.p2.getUsername(), slot: 1 },
                ],
                difficulty: this.difficulty,
            });

            if (this.countdownTimer) clearTimeout(this.countdownTimer);
            this.countdownTimer = setTimeout(() => {
                this.countdownTimer = null;
                if (this.p1 && this.p2 && this.p1.isReady() && this.p2.isReady()) {
                    this._startBroadcast();
                }
            }, this.startDelayMs);

            return true;
        }

        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        return false;
    }

    /**
     * Apply input flags to a player (up/down booleans).
     */
    applyInput(username, up, down) {
        const player = this.getPlayerByUsername(username);
        if (!player) return;
        player.up = up;
        player.down = down;
    }

    /**
     * Set the left player (p1) and sync paddle parameters.
     */
    setPlayer1(client) {
        this.p1 = client;
        client.speed = this.PAD_SPEED;
        client.padWidth = this.PAD_W;
        client.padHeight = this.PAD_H;
    }

    /**
     * Set the right player (p2) and sync paddle parameters.
     */
    setPlayer2(client) {
        this.p2 = client;
        client.speed = this.PAD_SPEED;
        client.padWidth = this.PAD_W;
        client.padHeight = this.PAD_H;
    }

    /**
     * Start the game loop after readiness and countdown checks.
     * Broadcasts state on each tick; stops on error or teardown.
     */
    _startBroadcast() {
        if (this.started) return;
        if (!this.p1 || !this.p2) return;

        const intervalMs = Math.max(16, Math.round(1000 / this.tickRate));
        this.started = true;
        this.startTime = Date.now();

        this.loop = setInterval(() => {
            try {
                this._tick();
                this._broadcast(this._publicState());
            } catch {
                clearInterval(this.loop);
                this.loop = null;
                this.started = false;
            }
        }, intervalMs);
    }

    /**
     * Advance game state (players and ball). End if a player reaches WINNING_SCORE.
     */
    _tick() {
        if (!this.started) return;

        this.state.tick += 1;
        this.p1.tick(this.ball);
        this.p2.tick(this.ball);

        const scored = this.ball.tick(this.p1, this.p2);
        const scorer = scored === -1 ? this.p1 : scored === 1 ? this.p2 : null;

        if (scorer && scorer.getScore() >= WINNING_SCORE) {
            this.onEnd();
        }
    }

    /**
     * Finalize the match, declare winner/loser, notify clients, and inform tournament.
     */
    onEnd() {
        this.started = false;
        this.ended = true;
        this.totalTime = Date.now() - this.startTime;

        if (this.loop) {
            clearInterval(this.loop);
            this.loop = null;
        }

        const winner = this.p1.getScore() > this.p2.getScore() ? this.p1 : this.p2;
        const loser = winner === this.p1 ? this.p2 : this.p1;

        this.winnerUsername = winner.getUsername();
        this.winnerScore = winner.getScore();
        winner.setScore(0);
        this.loserUsername = loser.getUsername();
        this.loserScore = loser.getScore();

        this.tournament._broadcast({
            type: SrvMessageType.MATCH_END,
            roomId: this.id,
            winner: this.winnerUsername,
            winner_score: this.winnerScore,
            loser: this.loserUsername,
            loser_score: this.loserScore,
        });

        this.p1.detachRoom();
        this.p2.detachRoom();

        this.tournament.onRoomEnd(this, winner, loser);
    }

    /**
     * Build the public, serializable state sent to both clients each tick.
     */
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
                    score: this.p1.getScore(),
                    y: this.p1.getY(),
                    pad: {
                        width: this.p1.getPadWidth(),
                        height: this.p1.getPadHeight(),
                        speed: this.p1.getSpeed(),
                    },
                },
                {
                    username: u2,
                    score: this.p2.getScore(),
                    y: this.p2.getY(),
                    pad: {
                        width: this.p2.getPadWidth(),
                        height: this.p2.getPadHeight(),
                        speed: this.p2.getSpeed(),
                    },
                },
            ],
            ball: {
                x: this.ball.getX(),
                y: this.ball.getY(),
                radius: this.ball.getRadius(),
            },
            size: { w: this.W, h: this.H },
        };
    }

    /**
     * Send a message to both players if present.
     */
    _broadcast(msg) {
        this.p1?.send(msg);
        this.p2?.send(msg);
    }
}