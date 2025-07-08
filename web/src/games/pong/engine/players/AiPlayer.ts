import { PlayerBase } from './PlayerBase'

export class AiPlayer extends PlayerBase {
    private readonly difficulty: string

    constructor(isLeft: boolean, canvas: HTMLCanvasElement, difficulty: string = 'medium') {
        let speed: number
        console .log(`Creating AI player with difficulty: ${difficulty}`)
        switch (difficulty) {
            case 'easy':
                speed = 4
                break
            case 'hard':
                speed = 6
                break
            default:
                speed = 5
        }
        super(isLeft, canvas, speed)
        this.difficulty = difficulty
    }

    update(ballY?: number): void {
        if (typeof ballY !== 'number') {
            return
        }

        const paddleCenter = this.y + this.height / 2

        if (Math.abs(ballY - paddleCenter) > 5) {
            if (ballY > paddleCenter) {
                this.y += this.speed
            } else {
                this.y -= this.speed
            }
        }

        // Ensure the paddle stays within the canvas bounds
        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y))
    }
}