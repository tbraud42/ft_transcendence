import { PlayerBase } from '../players/PlayerBase'

export abstract class BallBase {
    public x: number
    public y: number
    public readonly radius: number = 8
    public vx: number = 4
    public vy: number = 3

    constructor(startX: number, startY: number) {
        this.x = startX
        this.y = startY
    }

    // Must be implemented by subclasses
    abstract update(canvas: HTMLCanvasElement, player1: PlayerBase, player2: PlayerBase): void

    resetPosition(canvasWidth: number, canvasHeight: number): void {
        this.x = canvasWidth / 2
        this.y = canvasHeight / 2

        const speed = 5
        const minAngleDeg = 20
        const maxAngleDeg = 70

        const direction = Math.random() < 0.5 ? -1 : 1

        const angleDeg = minAngleDeg + Math.random() * (maxAngleDeg - minAngleDeg)
        const angleRad = angleDeg * (Math.PI / 180)

        this.vx = direction * speed * Math.cos(angleRad)
        this.vy = speed * Math.sin(angleRad) * (Math.random() < 0.5 ? -1 : 1)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
    }
}