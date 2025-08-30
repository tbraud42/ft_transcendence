export type ServerState = {
    width: number; height: number;
    paddleH: number; paddleW: number; paddleSpeed: number;
    ballSize: number; ballSpeed: number;
    p1y: number; p2y: number;
    bX: number; bY: number; vX: number; vY: number;
    s1: number; s2: number;
};

type Packet =
    | { type: "auth_ok"; user: { username: string; exp?: number } }
    | { type: "joined"; roomId: string; slot: 0 | 1 }
    | { type: "starting" }
    | { type: "state"; state: ServerState }
    | { type: "pong"; at: number }
    | { type: "error"; error: string; detail?: string }
    | { type: string; [k: string]: any };

type EventMap = {
    open: () => void;
    close: (ev?: CloseEvent | Event) => void;
    error: (ev?: Event) => void;
    message: (msg: Packet) => void;

    authed: (user: { username: string; exp?: number }) => void;
    joined: (roomId: string, slot: 0 | 1) => void;
    starting: () => void;
    state: (s: ServerState) => void;
};
export type EventKey = keyof EventMap;

export class WSClient {
    private readonly url: string;
    private readonly token: string;
    private socket?: WebSocket;
    private handlers: { [K in EventKey]?: Array<EventMap[K]> } = {};
    private heartbeatId?: number;
    private joinedRoomId?: string;

    constructor(url: string, token: TokenProvider) {
        this.url = url;
        this.token = token;
    }

    private emit<K extends EventKey>(type: K, ...args: Parameters<EventMap[K]>) {
        const arr = this.handlers[type];
        if (!arr) {
            return;
        }
        for (const fn of arr) {
            // @ts-ignore
            fn(...args);
        }
    }

    connect(): void {
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener("open", () => {
            this.emit("open");
            this.auth();
            this.startHeartbeat();
        });

        this.socket.addEventListener("close", (ev) => {
            this.emit("close", ev);
            this.stopHeartbeat();
        });

        this.socket.addEventListener("error", (ev) => {
            this.emit("error", ev);
        });

        this.socket.addEventListener("message", (ev) => {
            let msg: Packet;
            try {
                msg = JSON.parse(ev.data); 
            } catch {
                return; 
            }
            this.emit("message", msg);

            switch (msg.type) {
            case "auth_ok":
                this.emit("authed", msg.user);
                break;
            case "joined":
                this.emit("joined", msg.roomId, msg.slot);
                break;
            case "starting":
                this.emit("starting");
                break;
            case "state":
                this.emit("state", msg.state);
                break;
            case "pong":
            case "error":
            default:
                break;
            }
        });
    }

    disconnect(): void {
        this.stopHeartbeat();
        this.socket?.close();
    }

    isOpen(): boolean {
        return !!this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    on<K extends EventKey>(type: K, handler: EventMap[K]): void {
        (this.handlers[type] ??= []).push(handler);
    }
    off<K extends EventKey>(type: K, handler: EventMap[K]): void {
        const arr = this.handlers[type];
        if (!arr) {
            return;
        }
        const i = arr.indexOf(handler as any);
        if (i >= 0) {
            arr.splice(i, 1);
        }
    }

    private auth(): void {
        const token = this.token;
        if (!token) {
            return;
        }
        this.send("auth", { token });
    }

    join(roomId: string): void {
        this.joinedRoomId = roomId;
        if (this.isOpen()) {
            this.send("join", { roomId });
        }
    }

    input(up: boolean, down: boolean): void {
        if (!this.isOpen()) {
            return;
        }
        this.send("input", { up, down });
    }

    ping(): void {
        if (!this.isOpen()) {
            return;
        }
        this.send("ping", { at: Date.now() });
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatId = window.setInterval(() => this.ping(), 25_000);
    }
    private stopHeartbeat(): void {
        if (this.heartbeatId) {
            clearInterval(this.heartbeatId);
            this.heartbeatId = undefined;
        }
    }

    send(type: string, data: object = {}): void {
        this.socket?.send(JSON.stringify({ type, ...data }));
    }
}