import {ClientEvent, ServerEvent, SrvSnapshot} from './messageTypes'
import { getUsername } from "../../utils/storage";
import { renderBracket } from "../../components/bracket";
import {CliMessageType, SrvMessageType} from "./protocol";
import {createOverlayCard} from "../../components/overlayCard";
import {navigateTo} from "../../utils/router";
import {createPongCanvas} from "../../pages/pongPlay";
import {PongGame} from "../../games/pong/engine/PongGame";

export class WSClient {
    public ws: WebSocket | null = null
    private queued: ClientEvent[] = []
    private host: HTMLElement
    private canvas: HTMLCanvasElement
    private canvasWrapper: HTMLElement
    private latestSnapshot: SrvSnapshot | null = null
    public currentGame: PongGame | null = null

    constructor(host: HTMLElement) {
        this.host = host

        this.canvas = createPongCanvas()
        this.canvas.classList.add('rounded-2xl', 'shadow-xl', 'border', 'border-white/20')
        this.canvasWrapper = document.createElement('div')
        this.canvasWrapper.className = 'relative flex items-center justify-center p-4'
        this.canvasWrapper.appendChild(this.canvas)
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
                console.log(msg)
                this.latestSnapshot = msg as SrvSnapshot
                //TODO: save snapshot somewhere
                renderBracket(this.host, this.latestSnapshot, {
                    myUsername: getUsername(),
                    isOwner: msg.creator === getUsername(),
                    onAddBot: (addr) => {
                        if (!this.latestSnapshot) {
                            return;
                        } this.send({ type: CliMessageType.ADD_BOT, addr }) 
                    },
                    onRemove: (addr) => {
                        if (!this.latestSnapshot) {
                            return;
                        } this.send({ type: CliMessageType.REMOVE, addr }) 
                    },
                    onReady: (_addr) => {
                        const ready = !this.isClientReady(getUsername()); this.send({ type: CliMessageType.READY, ready }) 
                    },
                    isReady: (username, _addr) => this.isClientReady(username)
                })
                break
            }
            case SrvMessageType.PLAYER_READY: {
                break
            }
            case SrvMessageType.MATCH_START: {
                this.host.innerHTML = ''
                this.host.appendChild(this.canvasWrapper)

                const scoreOverlay = createScoreOverlay()
                const scoreLeft = scoreOverlay.children[0] as HTMLDivElement
                const scoreRight = scoreOverlay.children[1] as HTMLDivElement

                const me = msg.clients[0].username === getUsername() ? msg.clients[0] : msg.clients[1]
                const opponent = msg.clients[0].username !== getUsername() ? msg.clients[0] : msg.clients[1]

                this.currentGame = PongGame.createOnline(
                    msg.roomId,
                    this.canvas,
                    this, me.slot,
                    { me: me.username, opponent: opponent.username },
                    msg.difficulty,
                    scoreLeft,
                    scoreRight
                );
                this.currentGame.start()
                this.currentGame.startBall()
                break
            }
            case SrvMessageType.MATCH_END: {
                break
            }
            case SrvMessageType.PLAYER_KICK: {
                const overlay = createOverlayCard({
                    title: "Kick",
                    text: "You have been kicked from the lobby.",
                    onClose: () => navigateTo('/home')
                })
                this.host.appendChild(overlay.element)
                break
            }
            default: break
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

    isClientReady(username: string) : boolean {
        for (const p of this.latestSnapshot?.players || []) {
            if (p.username === username) {
                return p.isReady
            }
        }
        return false
    }
}

function createScoreOverlay(): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className =
        'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10'
    const left = document.createElement('div')
    const right = document.createElement('div')
    wrapper.append(left, right)
    return wrapper
}