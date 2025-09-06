const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");

const { getHandler } = require("./handlers");
const send = require("./utils/send"); // ton send.js
const publicUser = require("./utils/publicUser");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("Missing JWT_SECRET env var");
    process.exit(1);
}

const rooms = new Map();

function getOrCreateRoom(id) {
    if (!rooms.has(id)) {
        rooms.set(id, {
            players: [null, null],
            state: makeInitialState(),
            running: false,
            starting: false,
            startTimeout: null,
            intervalId: null,
            inputs: { up1: false, down1: false, up2: false, down2: false },
        });
    }
    return rooms.get(id);
}

function removePlayer(ws) {
    const { roomId, slot } = ws.meta || {};
    if (!roomId || slot == null) {
        return;
    }

    console.log(slot + " left the room " + roomId);

    const room = rooms.get(roomId);
    if (!room) {
        return;
    }

    room.players[slot] = null;

    if (room.running) {
        stopGame(room);
        broadcast(room, { type: "stopped" });
        room.running = false;
    }

    if (!room.players[0] && !room.players[1]) {
        if (room.intervalId) {
            clearInterval(room.intervalId);
        }
        rooms.delete(roomId);
        console.log("Room supprimée:", roomId);
    }
}

function broadcast(room, payload) {
    for (const p of room.players) {
        if (p && p.readyState === p.OPEN && p.isAuthed) {
            send(p, payload);
        }
    }
}

function makeInitialState() {
    return {
        width: 800,
        height: 450,
        paddleH: 80,
        paddleW: 10,
        paddleSpeed: 6,
        ballSize: 10,
        ballSpeed: 5,

        p1y: 185,
        p2y: 185,
        bX: 395,
        bY: 220,
        vX: 5,
        vY: 3,
        s1: 0,
        s2: 0,
    };
}

function resetBall(state, toLeft) {
    state.bX = (state.width - state.ballSize) / 2;
    state.bY = (state.height - state.ballSize) / 2;
    state.vX = toLeft ? -state.ballSpeed : state.ballSpeed;
    state.vY = (Math.random() * 2 - 1) * state.ballSpeed;
}

function step(state, inputs) {
    const { paddleSpeed, height, paddleH, ballSize, width } = state;

    if (inputs.up1) {
        state.p1y -= paddleSpeed;
    }
    if (inputs.down1) {
        state.p1y += paddleSpeed;
    }
    if (inputs.up2) {
        state.p2y -= paddleSpeed;
    }
    if (inputs.down2) {
        state.p2y += paddleSpeed;
    }

    state.p1y = Math.max(0, Math.min(height - paddleH, state.p1y));
    state.p2y = Math.max(0, Math.min(height - paddleH, state.p2y));

    state.bX += state.vX;
    state.bY += state.vY;

    if (state.bY <= 0 || state.bY + ballSize >= height) {
        state.vY = -state.vY;
    }

    if (state.bX <= 20) {
        if (state.bY + ballSize >= state.p1y && state.bY <= state.p1y + paddleH) {
            state.vX = Math.abs(state.vX);
            const hit = state.bY + ballSize / 2 - (state.p1y + paddleH / 2);
            state.vY += hit * 0.05;
        } else if (state.bX < 0) {
            state.s2 += 1;
            resetBall(state, false);
        }
    }
    if (state.bX + ballSize >= width - 20) {
        if (state.bY + ballSize >= state.p2y && state.bY <= state.p2y + paddleH) {
            state.vX = -Math.abs(state.vX);
            const hit = state.bY + ballSize / 2 - (state.p2y + paddleH / 2);
            state.vY += hit * 0.05;
        } else if (state.bX + ballSize > width) {
            state.s1 += 1;
            resetBall(state, true);
        }
    }
}

function startGame(room) {
    if (room.running || room.starting) {
        return;
    }

    room.starting = true;
    broadcast(room, { type: "starting", tMinusMs: 3000 });

    room.inputs = { up1: false, down1: false, up2: false, down2: false };

    room.startTimeout = setTimeout(() => {
        room.startTimeout = null;
        room.starting = false;
        if (room.running) return;

        room.running = true;

        let frame = 0;
        room.intervalId = setInterval(() => {
            step(room.state, room.inputs);
            frame++;
            broadcast(room, { type: "state", state: room.state });
        }, 1000 / 60);

        broadcast(room, { type: "start" });
    }, 5000);
}

function stopGame(room) {
    room.running = false;
    room.starting = false;
    if (room.intervalId) {
        clearInterval(room.intervalId);
    }
    room.intervalId = null;

    if (room.startTimeout) {
        clearTimeout(room.startTimeout);
        room.startTimeout = null;
    }
}

// Heartbeat (anti-timeout)
function startHeartbeat(wss) {
    setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, 30000);
}

const wss = new WebSocketServer({ port: PORT });

const ctxBase = {
    jwt,
    JWT_SECRET,
    send,
    publicUser,
    rooms,
    getOrCreateRoom,
    startGame,
    stopGame,
    broadcast,
};

wss.on("connection", (ws) => {
    ws.isAuthed = false;
    ws.user = null;
    ws.isAlive = true;
    ws.meta = { roomId: null, slot: null };

    const authTimeout = setTimeout(() => {
        if (!ws.isAuthed) {
            send(ws, { type: "error", error: "auth_timeout" });
            ws.close(4001, "Auth timeout");
        }
    }, 5000);

    ws.on("pong", () => {
        ws.isAlive = true;
    });

    ws.on("message", (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            send(ws, { type: "error", error: "invalid_json" });
            return;
        }
        const type = typeof msg?.type === "string" ? msg.type : null;
        if (!type) {
            send(ws, { type: "error", error: "missing_type" });
            return;
        }

        const handler = getHandler(type);
        if (!handler) {
            send(ws, { type: "error", error: "unknown_message" });
            return;
        }

        // Auth
        if (handler.requiresAuth && !ws.isAuthed) {
            send(ws, { type: "error", error: "auth_required" });
            return;
        }

        const ctx = {
            ...ctxBase,
            wss,
            ws,
            clearAuthTimeout: () => clearTimeout(authTimeout),
        };
        handler.handle(msg, ctx);
    });

    ws.on("close", () => {
        clearTimeout(authTimeout);
        removePlayer(ws);
    });

    ws.on("error", (e) => console.error("WS error:", e));
});

startHeartbeat(wss);
console.log(`WS Pong server listening on ws://localhost:${PORT}`);
