import type { ClientEvent, ServerEvent } from './messageTypes'
import { renderBracket } from '../../games/tournament/BracketTree'

export class WSClient {
    private ws: WebSocket | null = null
    private queued: ClientEvent[] = []
    private host: HTMLElement

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
            case 'snapshot': {
                renderBracket(this.host, msg)
                break
            }
            default:
                break
            }
        }
    }

    send(msg: ClientEvent) {
        const w = this.ws
        if (!w || w.readyState !== WebSocket.OPEN) {
            this.queued.push(msg); return 
        }
        w.send(JSON.stringify(msg))
    }

    close() {
        try {
            this.ws?.close() 
        } catch {} 
    }
}