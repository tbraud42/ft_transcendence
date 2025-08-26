const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('Missing JWT_SECRET env var');
    process.exit(1);
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
    ws.isAuthed = false;
    ws.user = null;

    const authTimeout = setTimeout(() => {
        if (!ws.isAuthed) {
            safeSend(ws, { type: 'error', error: 'auth_timeout' });
            ws.close(4001, 'Auth timeout');
        }
    }, 5000);

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            safeSend(ws, { type: 'error', error: 'invalid_json' });
            return;
        }

        if (!ws.isAuthed) {
            if (msg?.type !== 'auth' || typeof msg?.token !== 'string') {
                safeSend(ws, { type: 'error', error: 'auth_required' });
                return;
            }
            try {
                const decoded = jwt.verify(msg.token, JWT_SECRET);
                ws.isAuthed = true;
                ws.user = decoded;
                clearTimeout(authTimeout);
                safeSend(ws, { type: 'auth_ok', user: publicUser(decoded) });
                console.log('Authed client:', publicUser(decoded));
            } catch (err) {
                safeSend(ws, { type: 'error', error: 'invalid_token' });
                ws.close(4003, 'Invalid token');
            }
            return;
        }

        if (msg?.type === 'say' && typeof msg?.text === 'string') {
            const payload = {
                type: 'broadcast',
                from: publicUser(ws.user),
                text: msg.text,
                at: new Date().toISOString(),
            };
            for (const client of wss.clients) {
                if (client.readyState === ws.OPEN && client.isAuthed) {
                    safeSend(client, payload);
                }
            }
        } else {
            safeSend(ws, { type: 'error', error: 'unknown_message' });
        }
    });

    ws.on('close', () => {
        clearTimeout(authTimeout);
    });
    ws.on('error', (e) => console.error('WS error:', e));
});

function safeSend(ws, obj) {
    try {
        ws.send(JSON.stringify(obj));
    } catch (e) {}
}
function publicUser(decoded) {
    const { sub, name, roles, aud, iss } = decoded || {};
    return { sub, name, roles, aud, iss };
}

console.log(`WS auth server listening on ws://localhost:${PORT}`);