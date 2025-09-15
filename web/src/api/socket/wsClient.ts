import type { Snapshot } from '../../components/bracket/types';
import type { ClientEvent, ServerEvent } from './messageTypes'
import { getUsername } from "../../utils/storage";
import {renderBracket} from "../../components/bracket";

export class WSClient {
    private ws: WebSocket | null = null
    private queued: ClientEvent[] = []
    private host: HTMLElement

    constructor(host: HTMLElement) {
        this.host = host
    }

    connect(url: string, onOpen?: () => void) {
        this.ws = new WebSocket(url)
        console.log(url)
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
                console.log(msg)
                renderBracket(this.host, msg as Snapshot, {
                    myUsername: getUsername(),
                    isOwner: msg.creator.username === getUsername(),
                    onAddBot: (addr) => {
                        // ws.send({ type: 'add_bot', addr })
                    },
                    onReady: (addr) => {
                        // ws.send({ type: 'ready', addr })
                    },
                    isReady: (addr) => false // Return true if the player at addr is ready
                })
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