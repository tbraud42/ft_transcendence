// Bot.js
import { ClientBase } from './ClientBase.js';

export class Bot extends ClientBase {
    /**
     * Softer AI: 1 Hz perception via process(ball), 60 Hz control via tick(ball).
     * Difficulty presets: 'easy' (default) | 'normal' | 'hard'
     */
    constructor(username, { difficulty = 'easy' } = {}) {
        super(`bot:${username}`, username);
        this.bot = true;

        this.difficulty = difficulty;
        this._lastObsAt = 0;
        this._lastBall = null;
        this._vel = { vx: 0, vy: 0 };
        this._targetY = null;

        this._hesitateUntil = 0;
        this._viewPeriodMs = 1000; // 1 Hz
    }

    /**
     * Attach and auto-ready; reset internal state.
     */
    attachToRoom(room) {
        super.attachToRoom(room);
        this.setReady(true);
        this._lastObsAt = 0;
        this._lastBall = null;
        this._vel = { vx: 0, vy: 0 };
        this._targetY = room ? room.H * 0.5 : 0;
        this._hesitateUntil = 0;
    }

    /**
     * Perception & planning step executed about once per second.
     */
    process(ball) {
        const r = this.getRoom();
        if (!r || !ball) {
            return;
        }

        const now = Date.now();
        const bx = ball.getX?.() ?? 0;
        const by = ball.getY?.() ?? 0;
        const br = ball.getRadius?.() ?? 6;

        let vx = 0, vy = 0;
        if (typeof ball.getVelocity === 'function') {
            const v = ball.getVelocity();
            vx = Number(v?.vx ?? 0);
            vy = Number(v?.vy ?? 0);
        } else if (this._lastBall && this._lastObsAt) {
            const dt = Math.max(1, now - this._lastObsAt);
            vx = (bx - this._lastBall.x) / dt;
            vy = (by - this._lastBall.y) / dt;
        }
        this._vel = { vx, vy };
        this._lastBall = { x: bx, y: by, r: br };
        this._lastObsAt = now;

        const isLeft = r.p1 === this;
        const paddleX = isLeft ? (this.getPadWidth() + br) : (r.W - this.getPadWidth() - br);
        const towardBot = isLeft ? (vx < 0) : (vx > 0);

        if (!towardBot || Math.abs(vx) < 1e-6) {
            this._targetY = r.H * 0.5 + this._idleBias();
            this._maybeHesitate(now);
            this._maybeUsePowerups(r, ball);
            return;
        }

        const t = (paddleX - bx) / vx;
        if (t <= 0) {
            this._targetY = r.H * 0.5 + this._idleBias();
            this._maybeHesitate(now);
            this._maybeUsePowerups(r, ball);
            return;
        }

        const projY = this._projectYWithBounces(by, vy, t, r.H, br);
        const half = this.getPadHeight() * 0.5;

        let aim = projY + this._aimErrorPx() + this._anticipationLeadPx(t);
        const edgeOffset = this._maybeEdgeAim(half);
        aim += edgeOffset;

        this._targetY = this._clamp(aim, half, r.H - half);

        if (Math.random() < this._missProb()) {
            const missMag = half * (this.difficulty === 'easy' ? 1.2 : 0.6);
            this._targetY = this._clamp(this._targetY + (Math.random() * 2 - 1) * missMag, half, r.H - half);
        }

        this._maybeHesitate(now);
        this._maybeUsePowerups(r, ball);
    }

    /**
     * Control step executed each simulation tick (e.g., 60 Hz).
     */
    tick(ball) {
        const r = this.getRoom();
        if (!r) {
            return;
        }

        const now = Date.now();
        if (now < this._hesitateUntil) {
            this.setInput(false, false);
            return super.tick(ball);
        }

        const padCenter = this.getY() + this.getPadHeight() * 0.5;
        const target = this._targetY ?? (r.H * 0.5);
        const dz = this._deadzonePx();

        if (padCenter < target - dz) {
            this.setInput(false, true);
        } else if (padCenter > target + dz) {
            this.setInput(true, false);
        } else {
            this.setInput(false, false);
        }

        super.tick(ball);
    }

    _projectYWithBounces(y0, vy, tMs, H, r) {
        const min = r;
        const max = H - r;
        const span = Math.max(1, max - min);
        const y = y0 + vy * tMs;
        const dist = y - min;
        const period = 2 * span;
        const m = ((dist % period) + period) % period;
        return m <= span ? (min + m) : (max - (m - span));
    }

    _maybeUsePowerups(room, ball) {
        try {
            room?.usePowerup?.(this.username, ball); 
        } catch {}
    }

    _deadzonePx() {
        switch (this.difficulty) {
        case 'hard':   return Math.max(2, this.getPadHeight() * 0.05);
        case 'normal': return Math.max(4, this.getPadHeight() * 0.08);
        default:       return Math.max(6, this.getPadHeight() * 0.12);
        }
    }

    _aimErrorPx() {
        const h = this.getPadHeight();
        switch (this.difficulty) {
        case 'hard':   return (Math.random() * 2 - 1) * (h * 0.08);
        case 'normal': return (Math.random() * 2 - 1) * (h * 0.18);
        default:       return (Math.random() * 2 - 1) * (h * 0.32);
        }
    }

    _anticipationLeadPx(tMs) {
        const k = this.difficulty === 'hard' ? 0.10 : this.difficulty === 'normal' ? 0.06 : 0.03;
        return (tMs / 1000) * this.getSpeed() * k * this.getPadHeight();
    }

    _idleBias() {
        const h = this.getPadHeight();
        const amp = this.difficulty === 'hard' ? h * 0.05 : this.difficulty === 'normal' ? h * 0.10 : h * 0.18;
        return (Math.random() * 2 - 1) * amp;
    }

    _maybeHesitate(now) {
        const p = this.difficulty === 'hard' ? 0.05 : this.difficulty === 'normal' ? 0.10 : 0.18;
        if (Math.random() < p) {
            const dur = this.difficulty === 'hard' ? 90 : this.difficulty === 'normal' ? 150 : 220;
            this._hesitateUntil = now + dur + Math.floor(Math.random() * dur);
        } else {
            this._hesitateUntil = 0;
        }
    }

    _maybeEdgeAim(padHalf) {
        const prob = this.difficulty === 'hard' ? 0.2 : this.difficulty === 'normal' ? 0.3 : 0.4;
        if (Math.random() >= prob) {
            return 0;
        }
        const sign = Math.random() < 0.5 ? -1 : 1;
        const base = padHalf * (this.difficulty === 'easy' ? 0.85 : 0.7);
        const fuzz = (Math.random() * 0.2 - 0.1) * padHalf;
        return sign * (base + fuzz);
    }

    _missProb() {
        switch (this.difficulty) {
        case 'hard':   return 0.02;
        case 'normal': return 0.06;
        default:       return 0.12;
        }
    }

    _clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }
}