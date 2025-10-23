import { PlayerBase } from './PlayerBase'
import { BallBase } from '../balls/BallBase'
import { Difficulty } from '../../pongState'

export class AiPlayer extends PlayerBase {
    private readonly difficulty: Difficulty

    private lastObsAt = 0
    private lastBall: { x: number; y: number; r: number } | null = null

    private targetY: number | null = null
    private hesitateUntil = 0

    private readonly viewPeriodMs = 1000

    constructor(
        isLeft: boolean,
        canvas: HTMLCanvasElement,
        name: string,
        difficulty: Difficulty
    ) {
        super(isLeft, canvas, name)
        this.difficulty = difficulty
        this.targetY = canvas.height / 2
    }

    setRemoteY(_y: number): void {}

    public process(ball?: BallBase): void {
        if (!ball) return

        const now = Date.now()
        if (now - this.lastObsAt < this.viewPeriodMs) return

        const bx = ball.x
        const by = ball.y
        const br = ball.radius ?? 8

        let vx = ball.vx ?? 0
        let vy = ball.vy ?? 0

        if (this.lastBall && this.lastObsAt) {
            const dt = Math.max(1, now - this.lastObsAt)
            vx = (bx - this.lastBall.x) / dt
            vy = (by - this.lastBall.y) / dt
        }

        this.lastBall = { x: bx, y: by, r: br }
        this.lastObsAt = now

        const isApproaching = this.isLeft ? vx < 0 : vx > 0
        if (!isApproaching || Math.abs(vx) < 1e-6) {
            this.targetY = this.canvas.height / 2 + this._idleBias()
            this._maybeHesitate(now)
            return
        }

        const padX = this.isLeft
            ? this.width + br
            : this.canvas.width - this.width - br
        const tMs = (padX - bx) / vx
        if (tMs <= 0) {
            this.targetY = this.canvas.height / 2 + this._idleBias()
            this._maybeHesitate(now)
            return
        }

        const projY = this._projectYWithBounces(by, vy, tMs, this.canvas.height, br)
        const half = this.height / 2

        let aim =
            projY +
            this._aimErrorPx() +
            this._anticipationLeadPx(tMs) +
            this._maybeEdgeAim(half)

        this.targetY = this._clamp(aim, half, this.canvas.height - half)

        if (Math.random() < this._missProb()) {
            const miss = half * (this.difficulty === Difficulty.EASY ? 1.2 : 0.6)
            this.targetY = this._clamp(
                this.targetY + (Math.random() * 2 - 1) * miss,
                half,
                this.canvas.height - half
            )
        }

        this._maybeHesitate(now)
    }

    public update(_ball?: BallBase): void {
        const now = Date.now()
        if (now < this.hesitateUntil) {
            this.moveUp = false
            this.moveDown = false
            return
        }

        const padCenter = this.y + this.height / 2
        const target = this.targetY ?? this.canvas.height / 2
        const dz = this._deadzonePx()

        this.moveUp = padCenter > target + dz
        this.moveDown = padCenter < target - dz

        if (this.moveDown) this.y += this.speed
        if (this.moveUp) this.y -= this.speed

        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y))
    }

    private _deadzonePx(): number {
        switch (this.difficulty) {
            case Difficulty.HARD:
                return Math.max(2, this.height * 0.05)
            case Difficulty.MEDIUM:
                return Math.max(4, this.height * 0.08)
            default:
                return Math.max(6, this.height * 0.12) // EASY
        }
    }

    private _aimErrorPx(): number {
        const h = this.height
        switch (this.difficulty) {
            case Difficulty.HARD:
                return (Math.random() * 2 - 1) * (h * 0.08)
            case Difficulty.MEDIUM:
                return (Math.random() * 2 - 1) * (h * 0.18)
            default:
                return (Math.random() * 2 - 1) * (h * 0.32) // EASY
        }
    }

    private _anticipationLeadPx(tMs: number): number {
        const k =
            this.difficulty === Difficulty.HARD
                ? 0.1
                : this.difficulty === Difficulty.MEDIUM
                    ? 0.06
                    : 0.03
        return (tMs / 1000) * this.speed * k * this.height
    }

    private _idleBias(): number {
        const h = this.height
        const amp =
            this.difficulty === Difficulty.HARD
                ? h * 0.05
                : this.difficulty === Difficulty.MEDIUM
                    ? h * 0.1
                    : h * 0.18
        return (Math.random() * 2 - 1) * amp
    }

    private _maybeHesitate(now: number): void {
        const p =
            this.difficulty === Difficulty.HARD
                ? 0.05
                : this.difficulty === Difficulty.MEDIUM
                    ? 0.1
                    : 0.18

        if (Math.random() < p) {
            const base =
                this.difficulty === Difficulty.HARD
                    ? 90
                    : this.difficulty === Difficulty.MEDIUM
                        ? 150
                        : 220
            this.hesitateUntil = now + base + Math.random() * base
        } else {
            this.hesitateUntil = 0
        }
    }

    private _projectYWithBounces(
        y0: number,
        vy: number,
        tMs: number,
        H: number,
        r: number
    ): number {
        const min = r
        const max = H - r
        const span = Math.max(1, max - min)
        const y = y0 + vy * tMs
        const dist = y - min
        const period = 2 * span
        const m = ((dist % period) + period) % period
        return m <= span ? min + m : max - (m - span)
    }

    private _maybeEdgeAim(padHalf: number): number {
        const prob =
            this.difficulty === Difficulty.HARD
                ? 0.2
                : this.difficulty === Difficulty.MEDIUM
                    ? 0.3
                    : 0.4
        if (Math.random() >= prob) return 0

        const sign = Math.random() < 0.5 ? -1 : 1
        const base = padHalf * (this.difficulty === Difficulty.EASY ? 0.85 : 0.7)
        const fuzz = (Math.random() * 0.2 - 0.1) * padHalf
        return sign * (base + fuzz)
    }

    private _missProb(): number {
        switch (this.difficulty) {
            case Difficulty.HARD:
                return 0.02
            case Difficulty.MEDIUM:
                return 0.06
            default:
                return 0.12
        }
    }

    private _clamp(v: number, a: number, b: number): number {
        return Math.max(a, Math.min(b, v))
    }
}