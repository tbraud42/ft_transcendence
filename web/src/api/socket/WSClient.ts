import { ClientEvent, ServerEvent, SrvSnapshot, SrvState } from './messageTypes';
import { getUsername } from '../../utils/storage';
import { renderBracket } from '../../components/bracket';
import { CliMessageType, SrvMessageType } from './protocol';
import { createOverlayCard } from '../../components/overlayCard';
import { navigateTo } from '../../utils/router';
import { createPongCanvas } from '../../pages/pongPlay';
import { DEFAULT_BALL_RADIUS, PongGame } from '../../games/pong/engine/PongGame';
import i18n from '../../utils/lang/i18n';

export class WSClient {
    public ws: WebSocket | null = null;
    private queued: ClientEvent[] = [];
    private host: HTMLElement;
    private canvas: HTMLCanvasElement;
    private canvasWrapper: HTMLElement;
    private scoreLeft: HTMLElement;
    private scoreRight: HTMLElement;
    private timerDisplay: HTMLElement;
    private latestSnapshot: SrvSnapshot | null = null;
    public currentGame: PongGame | null = null;
    public ingame = false;

    // countdown/render lock + match timer
    private renderLockedUntil = 0;
    private timerInterval?: number;

    /**
     * Initialize the client UI (canvas and wrapper) for future use.
     */
    constructor(host: HTMLElement) {
        this.host = host;

        this.canvas = createPongCanvas();
        this.canvas.classList.add('rounded-2xl', 'shadow-xl', 'border', 'border-white/20');

        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.className = 'relative flex items-center justify-center p-4';
        this.canvasWrapper.appendChild(this.canvas);

        const scoreOverlay = createScoreOverlay();
        this.scoreLeft  = scoreOverlay.children[0] as HTMLDivElement;
        this.scoreRight = scoreOverlay.children[1] as HTMLDivElement;

        this.canvasWrapper.appendChild(scoreOverlay);

        this.timerDisplay = document.createElement('div');
        this.timerDisplay.className = 'absolute top-4 right-4 text-white text-xl font-mono z-10 pointer-events-none';
        this.timerDisplay.textContent = '00:00';

        this.canvasWrapper.appendChild(this.timerDisplay);
    }

    /**
     * Open a WebSocket connection and flush queued messages on open.
     */
    connect(url: string, onOpen?: () => void) {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
            onOpen?.();
            for (const m of this.queued) {
                this.send(m);
            }
            this.queued = [];
        };
        this.hookEvents();
    }

    /**
     * Attach WebSocket event handlers (message routing by server event type).
     */
    hookEvents() {
        if (!this.ws) {
            return;
        }
        this.ws.onmessage = (ev) => {
            let msg: ServerEvent | null = null;
            try {
                msg = JSON.parse(ev.data); 
            } catch {
                return; 
            }
            if (!msg) {
                return;
            }

            switch (msg.type) {
            case SrvMessageType.SNAPSHOT: {
                this.latestSnapshot = msg as SrvSnapshot;
                console.log(msg);
                if (this.ingame) {
                    return;
                }
                this.renderTree();
                break;
            }

            case SrvMessageType.PLAYER_READY: {
                // implicit update via server snapshot
                break;
            }

            case SrvMessageType.MATCH_START: {
                this.host.innerHTML = '';
                this.host.appendChild(this.canvasWrapper);
                this.ingame = true;

                const me  = msg.clients[0].username === getUsername() ? msg.clients[0] : msg.clients[1];
                const opp = msg.clients[0].username !== getUsername() ? msg.clients[0] : msg.clients[1];

                this.canvas.height = 480;
                this.canvas.width  = 640;

                this.currentGame = PongGame.createOnline(
                    msg.roomId,
                    this.canvas,
                    this,
                    me.slot,
                    { me: me.username, opponent: opp.username },
                    msg.difficulty,
                    DEFAULT_BALL_RADIUS,
                    this.scoreLeft,
                    this.scoreRight
                );

                const countdown = document.createElement('div');
                countdown.className = 'absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold pointer-events-none transition-all z-10 opacity-0';
                this.canvasWrapper.appendChild(countdown);

                this.currentGame.draw();
                this.currentGame.ball.draw(this.currentGame.ctx);

                this.renderLockedUntil = performance.now() + 3000;
                this.launchCountdown(countdown, () => {
                    countdown.remove();
                    this.startMatchTimer(this.timerDisplay);
                });

                break;
            }

            case SrvMessageType.MATCH_STATE: {
                if (!this.currentGame || this.currentGame.getId() !== (msg as any).roomId) {
                    break;
                }
                if (performance.now() < this.renderLockedUntil) {
                    break;
                }
                this.currentGame.lastState = msg as SrvState;
                if (!this.currentGame.gameEnded) {
                    this.currentGame.update();
                    this.currentGame.draw();
                }
                break;
            }

            case SrvMessageType.MATCH_END: {
                if (!msg.roomId || !this.currentGame || this.currentGame.getId() !== msg.roomId) {
                    return;
                }

                this.currentGame.stop();
                this.currentGame = null;
                this.stopMatchTimer();

                const title =
                        msg.winner === getUsername()
                            ? i18n.t('pong_game_over_you_win_title')
                            : i18n.t('pong_game_over_you_lose_title');

                const myScore       = msg.winner === getUsername() ? msg.winner_score : msg.loser_score;
                const opponentScore = msg.winner === getUsername() ? msg.loser_score  : msg.winner_score;

                const overlay = createOverlayCard({
                    title,
                    text: i18n.t('pong_game_over_text', { playerScore: myScore, opponentScore }),
                    onClose: () => {
                        this.ingame = false;
                        this.renderTree();
                    }
                });
                this.host.appendChild(overlay.element);
                break;
            }

            case SrvMessageType.PLAYER_KICK: {
                const overlay = createOverlayCard({
                    title: 'Kick',
                    text: i18n.t('pong_lobby_kicked'),
                    onClose: () => navigateTo('/home')
                });
                this.host.appendChild(overlay.element);
                break;
            }

            case SrvMessageType.GAME_FULL: {
                const overlay = createOverlayCard({
                    title: i18n.t('pong_lobby_full'),
                    onClose: () => navigateTo('/home')
                });
                this.host.appendChild(overlay.element);
                break;
            }

            default: break;
            }
        };
    }

    /**
     * Show a 3-2-1-GO overlay animation, then invoke the callback.
     */
    launchCountdown(container: HTMLElement, onComplete: () => void) {
        const seq = ['3', '2', '1', 'GO!'];
        let i = 0;
        const id = setInterval(() => {
            container.textContent = seq[i];
            container.style.opacity = '1';
            container.style.transform = 'scale(1.1)';
            setTimeout(() => {
                container.style.opacity = '0';
                container.style.transform = 'scale(1)';
            }, 400);
            i++;
            if (i === seq.length) {
                clearInterval(id);
                setTimeout(onComplete, 500);
            }
        }, 1000);
    }

    /**
     * Render the tournament bracket tree based on the latest snapshot.
     */
    renderTree() {
        if (!this.latestSnapshot) {
            return;
        }
        renderBracket(this.host, this.latestSnapshot, {
            myUsername: getUsername(),
            isOwner: this.latestSnapshot.creator === getUsername(),
            onAddBot: (roomId, slot) => {
                if (!this.latestSnapshot) {
                    return;
                }
                this.send({ type: CliMessageType.ADD_BOT, roomId, slot });
            },
            onRemove: (username) => {
                if (!this.latestSnapshot) {
                    return;
                }
                this.send({ type: CliMessageType.REMOVE, username });
            },
            onReady: (_addr) => {
                const ready = !this.isClientReady(getUsername());
                this.send({ type: CliMessageType.READY, ready });
            },
            isReady: (username) => this.isClientReady(username)
        });
    }

    /**
     * Send a client message, or queue it until the socket is open.
     */
    send(msg: ClientEvent) {
        const w = this.ws;
        if (!w || w.readyState !== WebSocket.OPEN) {
            this.queued.push(msg);
            return;
        }
        w.send(JSON.stringify(msg));
    }

    /**
     * Close the socket if present (ignore errors).
     */
    close() {
        try {
            this.ws?.close(); 
        } catch {}
    }

    /**
     * Check if a given user is ready according to the latest snapshot.
     */
    isClientReady(username: string): boolean {
        for (const p of this.latestSnapshot?.players || []) {
            if (p.username === username) {
                return p.isReady;
            }
        }
        return false;
    }

    /**
     * Start an mm:ss timer in the provided element and update it periodically.
     */
    private startMatchTimer(el: HTMLElement) {
        let start = Date.now();
        this.stopMatchTimer();
        this.timerInterval = window.setInterval(() => {
            const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const mm = String(Math.floor(s / 60)).padStart(2, '0');
            const ss = String(s % 60).padStart(2, '0');
            el.textContent = `${mm}:${ss}`;
        }, 250);
    }

    /**
     * Stop the running match timer if any.
     */
    private stopMatchTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
            this.timerDisplay.textContent = '00:00';
        }
    }
}

/**
 * Create the two-score overlay displayed at the top of the canvas.
 */
function createScoreOverlay(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className =
        'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10';
    const left = document.createElement('div');
    const right = document.createElement('div');
    wrapper.append(left, right);
    return wrapper;
}