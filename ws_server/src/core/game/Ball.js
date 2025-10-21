export class Ball {
    constructor(x, y, radius, width, height) {
        this.x = x; this.y = y;
        this.radius = radius;
        this.width = width;  this.height = height;

        this.speed = 5.5;
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.vx = dir * this.speed * 0.8;
        this.vy = (Math.random() < 0.5 ? -1 : 1) * this.speed * 0.4;
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
     * @return 1 if right scored, -1 if left scored, null otherwise
     */
    tick(player1, player2) {
        this.x += this.vx;
        this.y += this.vy;

        // Walls
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy);
        }
        if (this.y + this.radius > this.height) {
            this.y = this.height - this.radius;
            this.vy = -Math.abs(this.vy);
        }

        // Paddles (use actual draw positions)
        const p1x = 0;
        const p1y = player1.y;
        const p1w = player1.padWidth;
        const p1h = player1.padHeight;

        const p2w = player2.padWidth;
        const p2h = player2.padHeight;
        const p2x = this.width - p2w;
        const p2y = player2.y;

        // Left paddle: moving left, circle-AABB overlap
        if (
            this.vx < 0 &&
            this.x - this.radius <= p1x + p1w &&
            this.x > p1x &&
            this.y + this.radius >= p1y &&
            this.y - this.radius <= p1y + p1h
        ) {
            this.x = p1x + p1w + this.radius;
            this.vx = Math.abs(this.vx);
            const hit = (this.y - (p1y + p1h / 2)) / (p1h / 2); // -1..1
            this.vy = hit * this.speed * 0.8;
            this._accelerate();
        }

        // Right paddle: moving right, circle-AABB overlap
        if (
            this.vx > 0 &&
            this.x + this.radius >= p2x &&
            this.x < p2x + p2w &&
            this.y + this.radius >= p2y &&
            this.y - this.radius <= p2y + p2h
        ) {
            this.x = p2x - this.radius;
            this.vx = -Math.abs(this.vx);
            const hit = (this.y - (p2y + p2h / 2)) / (p2h / 2); // -1..1
            this.vy = hit * this.speed * 0.8;
            this._accelerate();
        }

        // Scoring
        if (this.x + this.radius < 0) {
            player2.score++; this._reset(1); return 1; 
        }
        if (this.x - this.radius > this.width) {
            player1.score++; this._reset(-1); return -1; 
        }

        return null;
    }

    _accelerate() {
        const k = 1.04;
        this.vx *= k; this.vy *= k;
        this.speed = Math.hypot(this.vx, this.vy);
    }

    _reset(dir) {
        this.x = this.width / 2;
        this.y = this.height / 2;
        const min = 0.25, max = 0.6; // slope range
        const slope = (Math.random() * (max - min) + min) * (Math.random() < 0.5 ? -1 : 1);
        const base = 5;
        this.vx = dir * base;
        this.vy = slope * base;
        this.speed = Math.hypot(this.vx, this.vy);
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