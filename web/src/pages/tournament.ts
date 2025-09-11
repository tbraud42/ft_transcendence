import PongCanvas from '../games/tournament/PongCanvas';
import OnlineRoom from '../games/tournament/OnlineRoom';
import BracketView from '../games/tournament/BracketView';

type TState = import('../games/tournament/PongCanvas').TState;

type SnapshotMatch = {
    id: string; p1?: string | null; p2?: string | null;
    winner?: string | null;
    score?: { s1: number; s2: number } | null;
};
type SnapshotPayload = {
    maxPlayers?: number;
    players?: string[];
    matches?: SnapshotMatch[];
    winner?: string | null;
};

export function renderTournament(
    appContainer: HTMLElement,
    wsUrl: string,
    token: string,
    tournamentId: string
) {
    const gameCanvas = document.getElementById('pong') as HTMLCanvasElement | null;
    if (!gameCanvas) throw new Error('Canvas #pong introuvable dans index.html');

    let stage = appContainer.querySelector('#tournament-stage') as HTMLDivElement | null;
    if (!stage) {
        stage = document.createElement('div');
        stage.id = 'tournament-stage';
        stage.className = 'space-y-4';
        appContainer.appendChild(stage);
    }
    stage.innerHTML = `
    <div class="text-sm text-slate-300">
      Room: <span id="room">–</span> · Slot: <span id="slot">–</span>
    </div>
    <div id="bracket" class="mt-4"></div>
  `;
    const roomEl  = stage.querySelector('#room')  as HTMLSpanElement;
    const slotEl  = stage.querySelector('#slot')  as HTMLSpanElement;
    const host    = stage.querySelector('#bracket') as HTMLDivElement;

    const bracket = new BracketView(host);

    let ws: WebSocket | null = null;
    let room: OnlineRoom | null = null;
    let canvas: PongCanvas | null = null;

    function setRoom(roomId: string | null, slot: number | null) {
        roomEl.textContent = roomId ?? '–';
        slotEl.textContent = slot != null ? String(slot) : '–';
    }

    function showLobby() {
        host.classList.remove('hidden');
        gameCanvas.style.display = 'none';
    }
    function showGame() {
        host.classList.add('hidden');
        gameCanvas.style.display   = 'block';
        gameCanvas.style.visibility = 'visible';
        gameCanvas.style.opacity    = '1';
        if (!gameCanvas.style.background) gameCanvas.style.background = '#0b1220';

        if (!canvas) canvas = new PongCanvas(gameCanvas);
    }

    function hydrateFromSnapshot(s: SnapshotPayload) {
        if (typeof s.maxPlayers === 'number') {
            bracket.setMaxPlayers(s.maxPlayers);
        } else if (Array.isArray(s.players) && s.players.length) {
            bracket.setPlayers(s.players);
        } else {
            bracket.setMaxPlayers(2);
        }

        if (Array.isArray(s.matches)) {
            for (const m of s.matches) {
                if (!m || !m.id) continue;
                const top = (m.p1 ?? '—') || '—';
                const bot = (m.p2 ?? '—') || '—';
                bracket.setPair(String(m.id), top, bot);
                if (m.winner) bracket.setWinner(String(m.id), String(m.winner), m.score ?? null);
            }
        }
        if (s.winner) bracket.setFinalWinner(String(s.winner));
    }

    function handleMessage(raw: any) {
        let msg: any; try { msg = JSON.parse(raw); } catch { return; }

        switch (msg.type) {
            case 'auth_ok':
                ws!.send(JSON.stringify({ type: 'join', tournamentId }));
                showLobby();
                break;

            case 'joined': {
                showLobby();
                const snap: SnapshotPayload | undefined =
                    msg.snapshot || msg.state || msg.bracket || undefined;
                if (snap) hydrateFromSnapshot(snap);
                break;
            }

            case 'tournament_state':
            case 'bracket_state':
            case 'snapshot':
                hydrateFromSnapshot(msg as SnapshotPayload);
                break;

            case 'match_assigned': {
                const matchId = String(msg.matchId ?? msg.roomId ?? '');
                const p1 = msg.players?.[0]?.username ?? '—';
                const p2 = msg.players?.[1]?.username ?? '—';
                if (typeof msg.maxPlayers === 'number') bracket.setMaxPlayers(Number(msg.maxPlayers));
                if (matchId) bracket.setPair(matchId, p1, p2);
                break;
            }

            case 'eliminated':
                if (typeof msg.user === 'string') bracket.markEliminated(String(msg.user));
                showLobby();
                break;

            case 'start': {
                showGame();
                if (ws && gameCanvas) {
                    room = new OnlineRoom(ws, canvas ?? new PongCanvas(gameCanvas), {
                        onStart: (roomId, slot) => setRoom(roomId, slot),
                        onState: (_s: TState) => {},
                        onStopped: (_info) => setRoom(null, null),
                    });
                    if (!canvas) canvas = (room as any)['canvas'];
                    room.setAuthedAndJoined(true);
                    room.handleMessage(msg);
                    room.attachControls();
                }
                break;
            }

            case 'state':
                if (room) room.handleMessage(msg);
                break;

            case 'stopped': {
                if (room) room.handleMessage(msg);
                const matchId = String(msg.roomId ?? '');
                const winner  = msg.winner ? String(msg.winner) : '';
                if (matchId && winner) bracket.setWinner(matchId, winner, msg.score ?? null);
                showLobby();
                break;
            }

            case 'waiting_next':
                showLobby();
                break;

            case 'tournament_winner':
                if (msg.winner) bracket.setFinalWinner(String(msg.winner));
                break;

            case 'left_tournament':
                showLobby();
                break;
        }
    }

    ws = new WebSocket(wsUrl);
    ws.onopen    = () => ws!.send(JSON.stringify({ type: 'auth', token }));
    ws.onmessage = (ev) => handleMessage(ev.data);
    ws.onclose   = () => { setRoom(null, null); showLobby(); };

    gameCanvas.style.display = 'none';
    showLobby();

    return () => {
        room?.detachControls();
        ws?.close();
    };
}