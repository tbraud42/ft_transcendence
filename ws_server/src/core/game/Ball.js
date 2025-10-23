export class Ball {
    constructor(x, y, radius, width, height, speed = 8) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.width = width;
        this.height = height;

        this.baseSpeed = speed;

        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
        const dir = Math.random() < 0.5 ? -1 : 1;

        this.vx = Math.cos(angle) * this.baseSpeed * dir;
        this.vy = Math.sin(angle) * this.baseSpeed;
        this.speed = Math.hypot(this.vx, this.vy);
    }

    getX() { return this.x; }
    getY() { return this.y; }
    getRadius() { return this.radius; }
    getVelocity() { return { vx: this.vx, vy: this.vy }; }

    tick(player1, player2) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y - this.radius < 0 || this.y + this.radius > this.height) {
            this.vy = -this.vy;
            this.y = Math.max(this.radius, Math.min(this.height - this.radius, this.y));
        }

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

        if (this.x + this.radius < 0) {
            player2.incrementScore();
            this._reset(1);
            return 1;
        }
        if (this.x - this.radius > this.width) {
            player1.incrementScore();
            this._reset(-1);
            return -1;
        }

        return null;
    }

    _accelerate() {
        const factor = 1.05;
        this.vx *= factor;
        this.vy *= factor;
        this.speed = Math.hypot(this.vx, this.vy);
    }

    _reset(dir) {
        this.x = this.width / 2;
        this.y = this.height / 2;

        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
        this.vx = this.baseSpeed * Math.cos(angle) * dir;
        this.vy = this.baseSpeed * Math.sin(angle);

        this.speed = this.baseSpeed;
    }
}