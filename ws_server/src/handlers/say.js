module.exports = {
    type: 'say',
    requiresAuth: true,

    handle(msg, { wss, ws, send }) {
        const text = typeof msg?.text === 'string' ? msg.text.trim() : '';
        if (!text) {
            send(ws, { type: 'error', error: 'text_required' });
            return;
        }

        const payload = {
            type: 'broadcast',
            from: { username: ws.user.username },
            text,
            at: new Date().toISOString(),
        };

        for (const client of wss.clients) {
            if (client.readyState === ws.OPEN && client.isAuthed) {
                send(client, payload);
            }
        }
    },
};