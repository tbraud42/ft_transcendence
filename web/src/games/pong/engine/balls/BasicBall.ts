import { BallBase } from './BallBase'
import { PlayerBase } from '../players/PlayerBase'

export class BasicBall extends BallBase {
    private baseSpeed: number

    constructor(startX: number, startY: number, baseSpeed: number = 8, radius: number = 8) {
        super(startX, startY, baseSpeed, radius)
        this.baseSpeed = baseSpeed

        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6
        const dir = Math.random() < 0.5 ? -1 : 1

        this.vx = Math.cos(angle) * this.baseSpeed * dir
        this.vy = Math.sin(angle) * this.baseSpeed
        this.speed = Math.hypot(this.vx, this.vy)
    }

    update(canvas: HTMLCanvasElement, player1: PlayerBase, player2: PlayerBase): void {
        this.x += this.vx
        this.y += this.vy

        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy = -this.vy
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y))
        }

        const p1x = 0
        const p1y = player1.y
        const p1w = player1.width
        const p1h = player1.height

        const hitLeft =
            this.vx < 0 &&
            this.x - this.radius <= p1x + p1w &&
            this.x >= p1x &&
            this.y + this.radius >= p1y &&
            this.y - this.radius <= p1y + p1h

        if (hitLeft) {
            this.x = p1x + p1w + this.radius
            this.vx = Math.abs(this.vx)

            const hit = (this.y - (p1y + p1h / 2)) / (p1h / 2)
            this.vy = hit * this.speed * 0.8
            this._accelerate()
        }

        const p2w = player2.width
        const p2h = player2.height
        const p2x = canvas.width - p2w
        const p2y = player2.y

        const hitRight =
            this.vx > 0 &&
            this.x + this.radius >= p2x &&
            this.x <= p2x + p2w &&
            this.y + this.radius >= p2y &&
            this.y - this.radius <= p2y + p2h

        if (hitRight) {
            this.x = p2x - this.radius
            this.vx = -Math.abs(this.vx)

            const hit = (this.y - (p2y + p2h / 2)) / (p2h / 2)
            this.vy = hit * this.speed * 0.8
            this._accelerate()
        }
    }

    checkScore(player1: PlayerBase, player2: PlayerBase, canvas: HTMLCanvasElement): boolean {
        if (this.x + this.radius < 0) {
            player2.score = (player2.score ?? 0) + 1
            this._reset(+1, canvas)
            return true
        }

        if (this.x - this.radius > canvas.width) {
            player1.score = (player1.score ?? 0) + 1
            this._reset(-1, canvas)
            return true
        }

        return false
    }

    private _accelerate(): void {
        const factor = 1.05
        this.vx *= factor
        this.vy *= factor
        this.speed = Math.hypot(this.vx, this.vy)
    }

    private _reset(dir: 1 | -1, canvas: HTMLCanvasElement): void {
        this.x = canvas.width / 2
        this.y = canvas.height / 2

        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6
        this.vx = this.baseSpeed * Math.cos(angle) * dir
        this.vy = this.baseSpeed * Math.sin(angle)

        this.speed = this.baseSpeed
    }

    public getX(): number { return this.x }
    public getY(): number { return this.y }
    public getRadius(): number { return this.radius }
    public getVelocity(): { vx: number; vy: number } { return { vx: this.vx, vy: this.vy } }

}