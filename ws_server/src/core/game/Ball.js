export class Ball {
    constructor(x, y, radius, width, height) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.width = width;
        this.height = height;

        this.vx = 4 * (Math.random() < 0.5 ? -1 : 1);
        this.vy = 2 * (Math.random() < 0.5 ? -1 : 1);
        this.speed = Math.hypot(this.vx, this.vy);
    }

    getX() {
        return this.x; 
    }
    getY() {
        return this.y; 
    }
    getRadius() {
        return this.radius; 
    }
    getVelocity() {
        return { vx: this.vx, vy: this.vy }; 
    }

    /**
     * @param player1 {ClientBase}
     * @param player2 {ClientBase}
     * @returns {number|null} 1 if right scores, -1 if left scores, null otherwise
     */
    tick(player1, player2) {
        this.x += this.vx;
        this.y += this.vy;

        // walls
        if (this.y - this.radius < 0 || this.y + this.radius > this.height) {
            this.vy = -this.vy;
            this.y = Math.max(this.radius, Math.min(this.height - this.radius, this.y));
        }

        // left paddle (x = 0)
        const p1x = 0;
        const p1y = player1.y;
        const p1w = player1.padWidth;
        const p1h = player1.padHeight;

        if (
            this.vx < 0 &&
            this.x - this.radius <= p1x + p1w &&
            this.x >= p1x &&
            this.y + this.radius >= p1y &&
            this.y - this.radius <= p1y + p1h
        ) {
            this.x = p1x + p1w + this.radius;
            this.vx = Math.abs(this.vx);
            const hit = (this.y - (p1y + p1h / 2)) / (p1h / 2);
            this.vy = hit * this.speed * 0.8;
            this._accelerate();
        }

        // right paddle (x = width - p2w)
        const p2w = player2.padWidth;
        const p2h = player2.padHeight;
        const p2x = this.width - p2w;
        const p2y = player2.y;

        if (
            this.vx > 0 &&
            this.x + this.radius >= p2x &&
            this.x <= p2x + p2w &&
            this.y + this.radius >= p2y &&
            this.y - this.radius <= p2y + p2h
        ) {
            this.x = p2x - this.radius;
            this.vx = -Math.abs(this.vx);
            const hit = (this.y - (p2y + p2h / 2)) / (p2h / 2);
            this.vy = hit * this.speed * 0.8;
            this._accelerate();
        }

        // scoring
        if (this.x + this.radius < 0) {
            player2.incrementScore()
            this._reset(1);
            return 1;
        }
        if (this.x - this.radius > this.width) {
            player1.incrementScore()
            this._reset(-1);
            return -1;
        }

        return null;
    }

    _accelerate() {
        const k = 1.05;
        this.vx *= k;
        this.vy *= k;
        this.speed = Math.hypot(this.vx, this.vy);
    }

    _reset(dir) {
        this.x = this.width / 2;
        this.y = this.height / 2;
        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
        const speed = 4;
        this.vx = speed * dir;
        this.vy = speed * Math.sin(angle);
        this.speed = speed;
    }

    setX(x) {
        this.x = x; 
    }
    setY(y) {
        this.y = y; 
    }
    setVelocity(vx, vy) {
        this.vx = vx; this.vy = vy; this.speed = Math.hypot(vx, vy); 
    }
}