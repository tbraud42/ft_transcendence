import { WSClient } from "../socket/WSClient";
import { Room } from "../games/pong/engine/Room";
import i18n from "../utils/lang/i18n";
import {getToken} from "../utils/storage";

export function renderPongLobby(roomId: string, wsUrl: string): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gap = "12px";

    const status = document.createElement("div");
    status.textContent = i18n.t('pong_lobby_connecting');

    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 450;

    container.append(status, canvas);

    const ws = new WSClient(wsUrl, getToken());

    const room = new Room(ws, canvas);

    ws.on('authed', () => {
        status.textContent = i18n.t('pong_lobby_authed');
        room.connectAndJoin(roomId);
    });

    ws.on('joined', (_room, _slot) => {
        status.textContent = i18n.t('pong_lobby_joined_waiting');
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

    return container;
}