import { BallBase } from './BallBase'
import { PlayerBase } from '../players/PlayerBase'

export class BasicBall extends BallBase {
    constructor(startX: number, startY: number, difficulty: string = 'medium') {
        const speed = difficulty === 'easy' ? 4.5 : difficulty === 'hard' ? 6.5 : 5.5
        super(startX, startY, speed)
    }

    update(canvas: HTMLCanvasElement, player1: PlayerBase, player2: PlayerBase) {
        this.x += this.vx
        this.y += this.vy

        // Vertical collision
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y))
        }

        // Collision with left paddle
        const leftPaddleX = 0
        const leftPaddleY = player1.y
        if (
            this.x - this.radius <= leftPaddleX + player1.width &&
            this.x > leftPaddleX &&
            this.y > leftPaddleY &&
            this.y < leftPaddleY + player1.height
        ) {
            // push ball outside if in paddle area
            this.x = leftPaddleX + player1.width + this.radius
            this.vx *= -1

            const offset = this.y - (leftPaddleY + player1.height / 2)
            const paddleVelocity = player1.moveUp ? -player1.speed : player1.moveDown ? player1.speed : 0

            this.vy += offset * 0.08 + paddleVelocity * 0.3
            this.vx *= 1.02
        }

        // Collision with right paddle
        const rightPaddleX = canvas.width - player2.width
        const rightPaddleY = player2.y
        if (
            this.x + this.radius >= rightPaddleX &&
            this.x < rightPaddleX + player2.width &&
            this.y > rightPaddleY &&
            this.y < rightPaddleY + player2.height
        ) {
            // push ball outside if in paddle area
            this.x = rightPaddleX - this.radius
            this.vx *= -1

            const offset = this.y - (rightPaddleY + player2.height / 2)
            const paddleVelocity = player2.moveUp ? -player2.speed : player2.moveDown ? player2.speed : 0

            this.vy += offset * 0.08 + paddleVelocity * 0.3
            this.vx *= 1.02
        }

        // Reset if out of bounds, count score
        if (this.x + this.radius < 0) {
            player2.addScore()
            this.resetPosition(canvas.width, canvas.height)
        } else if (this.x - this.radius > canvas.width) {
            player1.addScore()
            this.resetPosition(canvas.width, canvas.height)
        }

        // Friction and minimum speed
        const friction = 0.999
        const minSpeed = this.speed - 1

        this.vx *= friction
        this.vy *= friction

        if (Math.abs(this.vx) < minSpeed) {
            this.vx = minSpeed * Math.sign(this.vx)
        }
        if (Math.abs(this.vy) < minSpeed) {
            this.vy = minSpeed * Math.sign(this.vy)
        }
    }
}