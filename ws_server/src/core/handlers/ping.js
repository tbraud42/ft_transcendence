export default {
    type: 'ping',
    requiresAuth: false,

    /**
     * @param {any} _msg
     * @param {import('../client/Client.js').default} client
     */
    handle(_msg, client) {
        client.send({ type: 'pong', at: Date.now() })
    },
}