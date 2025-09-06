export default {
    type: 'auth',
    requiresAuth: false,

    /**
     * @param {{ token?: string }} msg
     * @param {import('../client/Client.js')} client
     */
    handle(msg, client) {
        const token = typeof msg?.token === 'string' ? msg.token : null
        if (!token) {
            console.error('No token provided')
            client.send({ type: 'error', error: 'token_required' })
            return
        }

        if (client.auth(token)) {
            client.send({ type: 'auth_ok' })
        } else {
            client.send({ type: 'error', error: 'invalid_token' })
            client.ws.close(4003, 'Invalid token')
        }
    },
}