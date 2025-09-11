module.exports = {
    type: 'auth',
    requiresAuth: false,

    handle(msg, { ws, jwt, JWT_SECRET, send, publicUser, clearAuthTimeout }) {
        const token = typeof msg?.token === 'string' ? msg.token : null;
        if (!token) {
            send(ws, { type: 'error', error: 'token_required' }); return; 
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET); // { username, exp }
            const username = typeof decoded?.username === 'string' ? decoded.username : null;
            if (!username) {
                send(ws, { type: 'error', error: 'username_missing' });
                ws.close(4003, 'Invalid token payload');
                return;
            }
            ws.isAuthed = true;
            ws.user = { username };
            clearAuthTimeout();
            send(ws, { type: 'auth_ok', user: publicUser(decoded) });
            console.log('Authed:', { username });
        } catch {
            send(ws, { type: 'error', error: 'invalid_token' });
            ws.close(4003, 'Invalid token');
        }
    },
};