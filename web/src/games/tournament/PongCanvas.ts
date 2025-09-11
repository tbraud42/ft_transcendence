export type TState = {
    width: number; height: number;
    paddleH: number; paddleW: number;
    ballSize: number;
    p1y: number; p2y: number;
    bX: number; bY: number;
    s1: number; s2: number;
};

export default class PongCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D context not available');
        this.ctx = ctx;
        this.canvas.width = 640;
        this.canvas.height = 480;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(state: TState) {
        const ctx = this.ctx;

        this.canvas.width = state.width;
        this.canvas.height = state.height;

        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, state.width, state.height);

        ctx.fillStyle = '#334155';
        for (let y = 0; y < state.height; y += 16) ctx.fillRect(state.width / 2 - 2, y, 4, 8);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 24px ui-sans-serif, system-ui';
        ctx.fillText(String(state.s1), state.width / 2 - 40, 40);
        ctx.fillText(String(state.s2), state.width / 2 + 24, 40);

        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(10, state.p1y, state.paddleW, state.paddleH);
        ctx.fillRect(state.width - 20, state.p2y, state.paddleW, state.paddleH);
        ctx.fillRect(state.width - 20, state.p2y, state.paddleW, state.paddleH);

        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(state.bX, state.bY, state.ballSize, state.ballSize);
    }
}