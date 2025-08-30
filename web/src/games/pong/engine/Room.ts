import { WSClient, ServerState } from "../../../socket/WSClient";

type Keys = { up: boolean; down: boolean };

export class Room {
    private ws: WSClient;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private keys: Keys = { up: false, down: false };
    private slot?: 0 | 1;
    private inGame = false;

    private onPageHide = () => this.ws.disconnect();

    constructor(ws: WSClient, canvas: HTMLCanvasElement) {
        this.ws = ws;
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D context not available");
        this.ctx = ctx;

        this.attachWS();
        this.attachKeyboard();
        this.attachLifecycle();
    }

    connectAndJoin(roomId: string): void {
        if (!this.ws.isOpen()) this.ws.connect();
        this.ws.join(roomId);
    }

    /** À appeler quand tu quittes la page/route du jeu dans ta SPA */
    destroy(): void {
        this.detachLifecycle();
        this.detachKeyboard();
        this.ws.disconnect();
    }

    private attachLifecycle() {
        window.addEventListener("pagehide", this.onPageHide, { passive: true });
    }

    private detachLifecycle() {
        window.removeEventListener("pagehide", this.onPageHide);
    }

    private attachWS() {
        this.ws.on("joined", () => { this.inGame = false; });
        this.ws.on("starting", () => { this.inGame = true; });
        this.ws.on("state", (s) => { if (this.inGame) this.render(s); });
        this.ws.on("close", () => { this.inGame = false; });
    }

    private keyDown = (e: KeyboardEvent) => {
        if (e.code === "ArrowUp")  { if (!this.keys.up)   { this.keys.up = true;  this.sendInput(); } }
        if (e.code === "ArrowDown"){ if (!this.keys.down) { this.keys.down = true; this.sendInput(); } }
    };
    private keyUp = (e: KeyboardEvent) => {
        if (e.code === "ArrowUp")  { if (this.keys.up)   { this.keys.up = false;  this.sendInput(); } }
        if (e.code === "ArrowDown"){ if (this.keys.down) { this.keys.down = false; this.sendInput(); } }
    };

    private attachKeyboard() {
        window.addEventListener("keydown", this.keyDown);
        window.addEventListener("keyup", this.keyUp);
    }
    private detachKeyboard() {
        window.removeEventListener("keydown", this.keyDown);
        window.removeEventListener("keyup", this.keyUp);
    }

    private sendInput() {
        this.ws.input(this.keys.up, this.keys.down);
    }

    private render(s: ServerState) {
        if (this.canvas.width !== s.width || this.canvas.height !== s.height) {
            this.canvas.width = s.width;
            this.canvas.height = s.height;
        }
        const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;

        ctx.fillStyle = "#000"; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "#fff";
        for (let y=0; y<H; y+=20) ctx.fillRect(W/2-1, y, 2, 10);

        ctx.font = "24px monospace"; ctx.textAlign = "center";
        ctx.fillText(String(s.s1 ?? 0), W*0.25, 30);
        ctx.fillText(String(s.s2 ?? 0), W*0.75, 30);

        ctx.fillRect(10, s.p1y, 10, s.paddleH);
        ctx.fillRect(W-20, s.p2y, 10, s.paddleH);
        ctx.fillRect(s.bX, s.bY, s.ballSize, s.ballSize);
    }
}