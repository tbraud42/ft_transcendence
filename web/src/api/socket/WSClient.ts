import { ClientEvent, ServerEvent, SrvSnapshot, SrvState } from './messageTypes';
import { getUsername } from '../../utils/storage';
import { renderBracket } from '../../components/bracket';
import { CliMessageType, SrvMessageType } from './protocol';
import { createOverlayCard } from '../../components/overlayCard';
import { navigateTo } from '../../utils/router';
import { DEFAULT_BALL_RADIUS, PongGame } from '../../games/pong/engine/PongGame';
import i18n from '../../utils/lang/i18n';

import {
    mountPlayScene,
    launchCountdown
} from '../../components/pongUi';

export class WSClient {
    public ws: WebSocket | null = null;
    private queued: ClientEvent[] = [];

    private host: HTMLElement;
    private latestSnapshot: SrvSnapshot | null = null;
    public currentGame: PongGame | null = null;
    public ingame = false;

    private renderLockedUntil = 0;
    private timer?: { start: () => void; stop: () => void };

    constructor(host: HTMLElement) {
        this.host = host;
    }

    connect(url: string, onOpen?: () => void) {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
            onOpen?.();
            this.queued.forEach(m => this.send(m));
            this.queued = [];
        };
        this.hookEvents();
    }

    hookEvents() {
        if (!this.ws) return;

        this.ws.onmessage = (ev) => {
            let msg: ServerEvent | null = null;
            try { msg = JSON.parse(ev.data); } catch { return; }
            if (!msg) return;

            switch (msg.type) {
                case SrvMessageType.SNAPSHOT:
                    this.latestSnapshot = msg;
                    if (!this.ingame) this.renderTree();
                    break;

                case SrvMessageType.MATCH_START:
                    this.startMatch(msg);
                    break;

                case SrvMessageType.MATCH_STATE:
                    this.updateMatchState(msg);
                    break;

                case SrvMessageType.MATCH_END:
                    this.endMatch(msg);
                    break;

                case SrvMessageType.PLAYER_KICK:
                    this.showKickOverlay();
                    break;

                case SrvMessageType.GAME_FULL:
                    this.showGameFullOverlay();
                    break;

                default:
                    break;
            }
        };
    }

    private startMatch(msg: any) {
        this.host.innerHTML = '';
        this.ingame = true;

        const me = msg.clients[0].username === getUsername() ? msg.clients[0] : msg.clients[1];
        const opp = msg.clients[0].username !== getUsername() ? msg.clients[0] : msg.clients[1];

        const {
            canvas,
            scoreLeft,
            scoreRight,
            countdown,
            timer
        } = mountPlayScene(this.host);

        scoreLeft.innerHTML = `${me.username}<br>0`;
        scoreRight.innerHTML = `${opp.username}<br>0`;

        this.timer = timer;

        this.currentGame = PongGame.createOnline(
            msg.roomId,
            canvas,
            this,
            me.slot,
            { me: me.username, opponent: opp.username },
            msg.difficulty,
            DEFAULT_BALL_RADIUS,
            scoreLeft,
            scoreRight
        );

        this.currentGame.draw();
        this.currentGame.ball.draw(this.currentGame.ctx);

        this.renderLockedUntil = performance.now() + 3000;
        launchCountdown(countdown, () => {
            countdown.remove();
            this.timer?.start();
        });
    }

    private updateMatchState(msg: any) {
        if (!this.currentGame || this.currentGame.getId() !== msg.roomId) return;
        if (performance.now() < this.renderLockedUntil) return;

        this.currentGame.lastState = msg as SrvState;
        if (!this.currentGame.gameEnded) {
            this.currentGame.update();
            this.currentGame.draw();
        }
    }

    private endMatch(msg: any) {
        if (!msg.roomId || !this.currentGame || this.currentGame.getId() !== msg.roomId) return;

        this.currentGame.stop();
        this.currentGame = null;
        this.timer?.stop();

        const title =
            msg.winner === getUsername()
                ? i18n.t('pong_game_over_you_win_title')
                : i18n.t('pong_game_over_you_lose_title');

        const myScore       = msg.winner === getUsername() ? msg.winner_score : msg.loser_score;
        const opponentScore = msg.winner === getUsername() ? msg.loser_score : msg.winner_score;

        const overlay = createOverlayCard({
            title,
            text: i18n.t('pong_game_over_text', { playerScore: myScore, opponentScore }),
            onClose: () => {
                this.ingame = false;
                this.renderTree();
            }
        });
        this.host.appendChild(overlay.element);
    }

    private showKickOverlay() {
        const overlay = createOverlayCard({
            title: 'Kick',
            text: i18n.t('pong_lobby_kicked'),
            onClose: () => navigateTo('/home')
        });
        this.host.appendChild(overlay.element);
    }

    private showGameFullOverlay() {
        const overlay = createOverlayCard({
            title: i18n.t('pong_lobby_full'),
            onClose: () => navigateTo('/home')
        });
        this.host.appendChild(overlay.element);
    }

    renderTree() {
        if (!this.latestSnapshot) return;

        renderBracket(this.host, this.latestSnapshot, {
            myUsername: getUsername(),
            isOwner: this.latestSnapshot.creator === getUsername(),

            onAddBot: (roomId, slot) => {
                this.send({ type: CliMessageType.ADD_BOT, roomId, slot });
            },

            onRemove: (username) => {
                this.send({ type: CliMessageType.REMOVE, username });
            },

            onReady: () => {
                const ready = !this.isClientReady(getUsername());
                this.send({ type: CliMessageType.READY, ready });
            },

            isReady: (username) => this.isClientReady(username)
        });
    }

    isClientReady(username: string): boolean {
        return this.latestSnapshot?.players?.some(p => p.username === username && p.isReady) ?? false;
    }

    send(msg: ClientEvent) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.queued.push(msg);
            return;
        }
        this.ws.send(JSON.stringify(msg));
    }

    close() {
        try { this.ws?.close(); } catch {}
    }
}