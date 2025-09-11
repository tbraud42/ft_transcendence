import PongCanvas, { TState } from './PongCanvas';

type Callbacks = {
    onStart?: (roomId: string, slot: number | null) => void;
    onState?: (state: TState) => void;
    onStopped?: (info: { reason?: string; winner?: string; score?: { s1: number; s2: number } }) => void;
};

export default class OnlineRoom {
    private ws: WebSocket;
    private canvas: PongCanvas;
    private roomId: string | null = null;
    private slot: number | null = null;
    private keyUp = false;
    private keyDown = false;
    private authedAndJoined = false;
    private cb: Callbacks;
    private listenersBound = false;

    private lastScore: { s1: number; s2: number } | null = null;

    constructor(ws: WebSocket, canvas: PongCanvas, callbacks: Callbacks = {}) {
        this.ws = ws;
        this.canvas = canvas;
        this.cb = callbacks;
    }

    setAuthedAndJoined(v: boolean) { this.authedAndJoined = v; }
    setAssignment(roomId: string | null, slot: number | null) { this.roomId = roomId; this.slot = slot; }

    attachControls() {
        if (this.listenersBound) return;
        this.listenersBound = true;

        const down = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') { this.keyUp = true; this.sendInput(); }
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { this.keyDown = true; this.sendInput(); }
        };
        const up = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') { this.keyUp = false; this.sendInput(); }
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { this.keyDown = false; this.sendInput(); }
        };
        const blur = () => { this.keyUp = this.keyDown = false; this.sendInput(); };

        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        (this as any)._handlers = { down, up, blur };
    }

    detachControls() {
        if (!this.listenersBound) return;
        const h = (this as any)._handlers;
        if (h) {
            window.removeEventListener('keydown', h.down);
            window.removeEventListener('keyup', h.up);
            window.removeEventListener('blur', h.blur);
        }
        this.listenersBound = false;
        this.keyUp = this.keyDown = false;
    }

    handleMessage(msg: any) {
        switch (msg.type) {
            case 'start': {
                this.setAssignment(msg.roomId ?? null, (msg.clients?.find?.((c: any) => c?.me)?.slot) ?? null);
                this.lastScore = null;
                this.cb.onStart?.(this.roomId!, this.slot);
                return;
            }
            case 'state': {
                if (msg.state) {
                    const s = msg.state as TState;
                    this.canvas.draw(s);
                    this.cb.onState?.(s);
                }
                return;
            }
            case 'stopped': {
                this.setAssignment(null, null);
                this.lastScore = msg.score ?? null;
                this.cb.onStopped?.({ reason: msg.reason, winner: msg.winner, score: msg.score });
                return;
            }
        }
    }

    getLastScore() { return this.lastScore; }

    private sendInput() {
        if (!this.authedAndJoined) return;
        if (this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: 'input', up: this.keyUp, down: this.keyDown }));
    }
}