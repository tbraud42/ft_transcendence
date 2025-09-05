import i18n from "../utils/lang/i18n";
import {WSClient} from "../socket/WSClient";
import {getToken, getUsername} from "../utils/storage";
import {PongGame} from "../games/pong/engine/PongGame";
import {selectedDifficulty} from "../games/pong/pongState";

export function renderPongLobby(roomId: string, wsUrl: string): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gap = "12px";

    const status = document.createElement("div");
    status.textContent = i18n.t('pong_lobby_connecting');

    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 450;

    container.append(status, canvas);

    const scoreLeftEl = document.createElement('div');
    const scoreRightEl = document.createElement('div');
    scoreLeftEl.className = 'absolute top-4 left-1/2 transform -translate-x-20 text-white text-3xl font-mono';
    scoreRightEl.className = 'absolute top-4 left-1/2 transform translate-x-20 text-white text-3xl font-mono';
    container.append(scoreLeftEl, scoreRightEl);

    const ws = new WSClient(wsUrl, getToken());

    ws.on('authed', () => {
        status.textContent = i18n.t('pong_lobby_authed');
        ws.join(roomId);
    });

    ws.on('starting', () => {
        status.textContent = i18n.t('pong_lobby_starting');
    });

    ws.on('close', () => {
        status.textContent = i18n.t('pong_lobby_disconnected');
    });

    ws.on('error', () => {
        status.textContent = i18n.t('pong_lobby_network_error');
    });

    ws.connect();

    ws.on('joined', (_roomId, slot) => {
        status.textContent = i18n.t('pong_lobby_joined_waiting');
        const game = PongGame.createOnline(
            canvas,
            ws,
            slot,
            { me: getUsername(), opponent: 'Adversaire' },
            selectedDifficulty,
            scoreLeftEl,
            scoreRightEl
        );
        game.start();
    });

    return container;
}