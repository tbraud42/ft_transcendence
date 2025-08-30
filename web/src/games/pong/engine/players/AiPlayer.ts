import { PlayerBase } from './PlayerBase'
import { BallBase } from '../balls/BallBase'

export class AiPlayer extends PlayerBase {
    private targetY: number = 0
    private lastUpdate = 0
    private visionDelay = 1000 // ms
    private errorMargin: number

    constructor(
        isLeft: boolean,
        canvas: HTMLCanvasElement,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ) {
        let errorMargin: number

        switch (difficulty) {
        case 'easy':
            errorMargin = 125
            break
        case 'hard':
            errorMargin = 75
            break
        default:
            errorMargin = 100
        }

        super(isLeft, canvas, 5)
        this.errorMargin = errorMargin
        this.targetY = canvas.height / 2
        this.lastUpdate = Date.now()
    }

    update(ball?: BallBase): void {
        if (!ball) {
            return
        }

        const now = Date.now()

        // Predict ball position only if it's on the player's side
        const isBallOnMySide = this.isLeft
            ? ball.x < this.canvas.width / 2
            : ball.x > this.canvas.width / 2

        if (isBallOnMySide && now - this.lastUpdate > this.visionDelay) {
            this.targetY = this.predictBallY(ball)
            this.lastUpdate = now
        }

        const paddleCenter = this.y + this.height / 2
        this.moveUp = this.targetY < paddleCenter - 5
        this.moveDown = this.targetY > paddleCenter + 5

        if (this.moveUp) {
            this.y -= this.speed
        } else if (this.moveDown) {
            this.y += this.speed
        }

        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y))
    }

    private predictBallY(ball: BallBase): number {
        let y = ball.y
        let vy = ball.vy
        let x = ball.x
        const vx = ball.vx
        const targetX = this.isLeft ? this.width : this.canvas.width - this.width

        const maxIterations = 1000
        let iterations = 0

        if ((this.isLeft && vx > 0) || (!this.isLeft && vx < 0)) {
            return y
        }

        while ((this.isLeft ? x > targetX : x < targetX) && iterations < maxIterations) {
            x += vx
            y += vy

            if (y <= 0 || y >= this.canvas.height) {
                vy *= -1
            }

            iterations++
        }

        const offset = (Math.random() - 0.5) * 2 * this.errorMargin
        return y + offset
    }
}