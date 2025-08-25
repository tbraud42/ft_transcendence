type Packet = { type: string; [k: string]: any };

export class WSClient {
    private socket: WebSocket;
    private handlers: Record<string, (p: Packet) => void> = {};
    private readyPromise: Promise<void>;
    private readyResolve!: () => void;

    constructor(baseUrl: string, roomId: number | string, token: string) {
        this.readyPromise = new Promise<void>((res) => (this.readyResolve = res));

        this.socket = new WebSocket(`${baseUrl}/${roomId}`);

        this.socket.onopen = () => {
            this.auth(token);
        };

        this.socket.onmessage = (evt) => {
            try {
                const msg: Packet = JSON.parse(evt.data);
                if (msg.type === "auth_ok") {
                    console.log("Auth OK", msg.user);
                    this.readyResolve();
                    return;
                }
                if (msg.type === "error") {
                    console.error("WS error:", msg.error);
                    return;
                }
                const fn = this.handlers[msg.type];
                if (fn) fn(msg);
                else console.warn("No handler for packet:", msg.type, msg);
            } catch {
                console.warn("Invalid frame:", evt.data);
            }
        };

        this.socket.onerror = (err) => console.error("WS error", err);
        this.socket.onclose = () => console.info("WS closed");
    }

    auth(token: string) {
        this.socket.send(JSON.stringify({ type: "auth", token }));
    }

    ready() {
        return this.readyPromise;
    }

    on(type: string, handler: (p: Packet) => void) {
        this.handlers[type] = handler;
    }

    send(type: string, data: object = {}) {
        this.socket.send(JSON.stringify({ type, ...data }));
    }
}