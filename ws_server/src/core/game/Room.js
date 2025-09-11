export class Room {
    constructor(tournament, roomId, clients) {
        this.tournament = tournament;
        this.id = roomId;
        this.clients = clients;
        this.state = Room.makeInitialState();
        this.inputs = { up1: false, down1: false, up2: false, down2: false };
        this.running = false;
        this.starting = false;
        this.startTimeout = null;
        this.intervalId = null;
    }

    static makeInitialState() {
        return {
            width: 640,
            height: 480,
            paddleH: 80,
            paddleW: 10,
            paddleSpeed: 6,
            ballSize: 10,
            ballSpeed: 5,
            p1y: 200,
            p2y: 200,
            bX: 315,
            bY: 235,
            vX: 5,
            vY: 3,
            s1: 0,
            s2: 0,
        };
    }

    broadcast(payload, exceptUsername = null) {
        for (const c of this.tournament.clients.values()) {
            if (exceptUsername && c.username === exceptUsername) {
                continue;
            }
            c.send(payload);
        }
    }

    resetBall(toLeft) {
        const s = this.state;
        s.bX = (s.width - s.ballSize) / 2;
        s.bY = (s.height - s.ballSize) / 2;
        s.vX = toLeft ? -s.ballSpeed : s.ballSpeed;
        s.vY = (Math.random() * 2 - 1) * s.ballSpeed;
    }

    step() {
        const s = this.state;
        const { paddleSpeed, height, paddleH, ballSize, width } = s;

        if (this.inputs.up1) {
            s.p1y -= paddleSpeed;
        }
        if (this.inputs.down1) {
            s.p1y += paddleSpeed;
        }
        if (this.inputs.up2) {
            s.p2y -= paddleSpeed;
        }
        if (this.inputs.down2) {
            s.p2y += paddleSpeed;
        }

        s.p1y = Math.max(0, Math.min(height - paddleH, s.p1y));
        s.p2y = Math.max(0, Math.min(height - paddleH, s.p2y));

        s.bX += s.vX;
        s.bY += s.vY;

        if (s.bY <= 0 || s.bY + ballSize >= height) {
            s.vY = -s.vY;
        }

        // left paddle zone x <= 20
        if (s.bX <= 20) {
            const hit = s.bY + ballSize >= s.p1y && s.bY <= s.p1y + paddleH;
            if (hit) {
                s.vX = Math.abs(s.vX);
                const diff = s.bY + ballSize / 2 - (s.p1y + paddleH / 2);
                s.vY += diff * 0.05;
            } else if (s.bX < 0) {
                s.s2 += 1;
                this.resetBall(false);
                if (s.s2 >= (this.tournament?.winScore ?? 5)) {
                    this.finish();
                    return;
                }
            }
        }

        // right paddle zone x >= width - 20
        if (s.bX + ballSize >= width - 20) {
            const hit = s.bY + ballSize >= s.p2y && s.bY <= s.p2y + paddleH;
            if (hit) {
                s.vX = -Math.abs(s.vX);
                const diff = s.bY + ballSize / 2 - (s.p2y + paddleH / 2);
                s.vY += diff * 0.05;
            } else if (s.bX + ballSize > width) {
                s.s1 += 1;
                this.resetBall(true);
                if (s.s1 >= (this.tournament?.winScore ?? 5)) {
                    this.finish();
                    return;
                }
            }
        }
    }

    start(delayMs = 3000) {
        if (this.running || this.starting) {
            return;
        }
        this.starting = true;

        this.broadcast({
            type: 'starting',
            roomId: this.id,
            tMinusMs: delayMs,
        });

        this.startTimeout = setTimeout(() => {
            this.startTimeout = null;
            this.starting = false;
            if (this.running) {
                return;
            }

            const [u1, u2] = this.clients;
            if (!this.tournament.clients.has(u1) || !this.tournament.clients.has(u2)) {
                this.broadcast({ type: 'match_cancelled', roomId: this.id, reason: 'client_left' });
                return;
            }

            this.running = true;
            this.broadcast({
                type: 'start',
                roomId: this.id,
                clients: [
                    { username: u1, slot: 0 },
                    { username: u2, slot: 1 },
                ],
            });

            let frame = 0;
            this.intervalId = setInterval(() => {
                this.step();
                frame++;
                // send every frame; tune if needed
                this.broadcast({ type: 'state', roomId: this.id, state: this.state });
            }, 1000 / 60);
        }, delayMs);
    }

    stop() {
        this.running = false;
        this.starting = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = null;
        if (this.startTimeout) {
            clearTimeout(this.startTimeout);
        }
        this.startTimeout = null;
    }

    removeClient(username) {
        const idx = this.clients.indexOf(username);
        if (idx !== -1) {
            this.clients[idx] = null;
        }
        if (this.running || this.starting) {
            this.stop();
            this.broadcast({ type: 'stopped', roomId: this.id });
        }
    }


    finish() {
        if (!this.running) return;
        const s = this.state;
        this.stop();

        const [u1, u2] = this.clients;
        const winner = s.s1 > s.s2 ? u1 : u2;
        const loser  = s.s1 > s.s2 ? u2 : u1;

        this.broadcast({
            type: 'stopped',
            roomId: this.id,
            reason: 'score_limit',
            winner,
            score: { s1: s.s1, s2: s.s2 },
        });

        if (this.tournament && typeof this.tournament.handleMatchResult === 'function') {
            this.tournament.handleMatchResult({
                room: this,
                winner,
                loser,
                score: { s1: s.s1, s2: s.s2 }
            });
        }
    }
}