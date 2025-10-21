import { SrvMessageType } from '../client/protocol.js';
import {Ball} from "./Ball.js";

const WINNING_SCORE = 10;

export class Room {
    constructor({ tournament, id, difficulty, tickRate = 60 }) {
        this.tournament = tournament;
        this.difficulty = difficulty;
        this.id = id;

        // store usernames (not objects)
        this.p1 = null;
        this.p2 = null;

        this.tickRate = tickRate;
        this.loop = null;
        this.started = false; // broadcasting started
        this.startTime = 0;
        this.totalTime = 0;
        this.ended = false;
        this.winnerUsername = null;
        this.winnerScore = 0;
        this.loserUsername = null;
        this.loserScore = 0;


        // world
        this.W = 640;
        this.H = 480;
        this.PAD_W = 10;
        this.PAD_H = 100;
        this.PAD_SPEED = 5;

        this.ball = new Ball(this.W / 2, this.H / 2, 8, this.W, this.H);

        // minimal state; keys will be usernames
        this.state = {
            tick: 0,
            score: {},
            paddles: {},
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

    setPlayer1(client) {
        this.p1 = client;
        client.speed = this.PAD_SPEED;
        client.padWidth = this.PAD_W;
        client.padHeight = this.PAD_H;
    }

    setPlayer2(client) {
        this.p2 = client;
        client.speed = this.PAD_SPEED;
        client.padWidth = this.PAD_W;
        client.padHeight = this.PAD_H;
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
        this.startTime = Date.now();
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
        if (!this.started) {
            return;
        }
        this.state.tick += 1;
        this.p1.tick(this.ball);
        this.p2.tick(this.ball);
        const score = this.ball.tick(this.p1, this.p2);
        const player = score === -1 ? this.p1 : score === 1 ? this.p2 : null;
        if (player) {
            if (player.getScore() >= WINNING_SCORE) {
                this.onWin();
            }
        }

        //TODO: process scoring
        //TODO: timer?
    }

    onWin() {
        this.started = false;
        this.ended = false;
        this.totalTime = Date.now() - this.startTime;
        clearInterval(this.loop);
        this.loop = null;

        const winner = this.p1.getScore() > this.p2.getScore() ? this.p1 : this.p2;
        const loser = winner === this.p1 ? this.p2 : this.p1;

        this.winnerUsername = winner.getUsername();
        this.winnerScore = winner.getScore();
        this.loserUsername = loser.getUsername();
        this.loserScore = loser.getScore();

        console.log("Match ended:", this.winnerUsername, "defeated", this.loserUsername, "in", (this.totalTime / 1000).toFixed(2), "seconds");

        console.log({
            type: SrvMessageType.MATCH_END,
            roomId: this.id,
            winner: this.winnerUsername,
            winner_score: this.winnerScore,
            loser: this.loserUsername,
            loser_score: this.loserScore,
        })

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
                    score: this.p1.getScore(),
                    y: this.p1.getY(),
                    pad: { width: this.p1.getPadWidth(), height: this.p1.getPadHeight(), speed: this.p1.getSpeed() }
                },
                {
                    username: u2,
                    score: this.p2.getScore(),
                    y: this.p2.getY(),
                    pad: { width: this.p2.getPadWidth(), height: this.p2.getPadHeight(), speed: this.p2.getSpeed() }
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

        this.ball.setX(this.W / 2);
        this.ball.setY(this.H / 2);
        this.ball.setVelocity(0, 0);
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