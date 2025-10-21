import { PlayerBase } from '../players/PlayerBase'

export abstract class BallBase {
    public x: number
    public y: number
    public speed: number = 5
    public radius: number = 8
    public vx: number = 4
    public vy: number = 3

    constructor(startX: number, startY: number, speed: number = 5, radius: number = 8) {
        this.x = startX
        this.y = startY
        this.speed = speed
        this.radius = radius
    }

    abstract update(canvas: HTMLCanvasElement, player1: PlayerBase, player2: PlayerBase): void

    /**
     * Returns true if a point was scored and the ball was reset to center.
     */
    public abstract checkScore(
        player1: PlayerBase,
        player2: PlayerBase,
        canvas: HTMLCanvasElement
    ): boolean;

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
    }
}