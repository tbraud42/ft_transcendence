import {ClientEvent, ServerEvent, SrvSnapshot} from './messageTypes'
import { getUsername } from "../../utils/storage";
import { renderBracket } from "../../components/bracket";
import {CliMessageType, SrvMessageType} from "./protocol";

export class WSClient {
    private ws: WebSocket | null = null
    private queued: ClientEvent[] = []
    private host: HTMLElement
    private latestSnapshot: SrvSnapshot | null = null

    constructor(host: HTMLElement) {
        this.host = host
    }

    connect(url: string, onOpen?: () => void) {
        this.ws = new WebSocket(url)
        this.ws.onopen = () => {
            onOpen?.()
            for (const m of this.queued) {
                this.send(m)
            }
            this.queued = []
        }
        this.ws.onmessage = (ev) => {
            let msg: ServerEvent | null = null
            try {
                msg = JSON.parse(ev.data) 
            } catch {
                return 
            }
            if (!msg) {
                return
            }

            switch (msg.type) {
            case SrvMessageType.SNAPSHOT: {
                this.latestSnapshot = msg as SrvSnapshot
                renderBracket(this.host, this.latestSnapshot, {
                    myUsername: getUsername(),
                    isOwner: msg.creator === getUsername(),
                    onAddBot: (addr) => {
                        if (!this.latestSnapshot) {
                            return
                        }
                        this.send({ type: CliMessageType.ADD_BOT, addr })
                    },
                    onRemoveBot: (addr) => {
                        if (!this.latestSnapshot) {
                            return
                        }
                        this.send({ type: CliMessageType.REMOVE_BOT, addr })
                    },
                    onReady: (addr) => {
                        const ready = !this.isClientReady(getUsername())
                        this.send({ type: CliMessageType.READY, ready })
                    },
                    isReady: (username, addr) => {
                        return this.isClientReady(username)
                    }
                })
                break
            }
            case SrvMessageType.PLAYER_READY: {
            }
            default:
                break
            }
        }
    }

    send(msg: ClientEvent) {
        const w = this.ws
        if (!w || w.readyState !== WebSocket.OPEN) {
            this.queued.push(msg);
            return
        }
        w.send(JSON.stringify(msg))
    }

    close() {
        try {
            this.ws?.close() 
        } catch {} 
    }

    isClientReady(username: string) : boolean {
        for (const p of this.latestSnapshot?.players || []) {
            if (p.username === username) {
                return p.isReady
            }
        }
        return false
    }
}