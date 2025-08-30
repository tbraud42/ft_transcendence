import { WSClient } from "../socket/WSClient";
import { Room } from "../games/pong/engine/Room";

export function renderPongLobby(roomId: string, wsUrl: string, tokenProvider: () => string | null): HTMLElement {
    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gap = "12px";

    const status = document.createElement("div");
    status.textContent = "Connexion…";

    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 450;

    container.append(status, canvas);

    const ws = new WSClient(wsUrl, tokenProvider);

    const room = new Room(ws, canvas);

    ws.on("open", () => {
        status.textContent = "Connecté. Authentification…"; 
    });
    ws.on("authed", () => {
        status.textContent = "Authentifié. Rejoindre/Créer la room…";
        room.connectAndJoin(roomId);
    });

    ws.on("joined", (_room, _slot) => {
        status.textContent = "Room rejointe. En attente d'un autre joueur…";
    });

    ws.on("starting", () => {
        status.textContent = "La room est pleine. Démarrage…";
    });

    ws.on("close", () => {
        status.textContent = "Déconnecté. Rafraîchis la page pour réessayer.";
    });

    ws.on("error", () => {
        status.textContent = "Erreur réseau.";
    });

    ws.connect();

    return container;
}