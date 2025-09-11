const auth = require('./auth');
const ping = require('./ping');
const join = require('./joinRoom');
const input = require('./input');

const registry = {
    [auth.type]: auth,
    [ping.type]: ping,
    [join.type]: join,
    [input.type]: input,
};

function getHandler(type) {
    return registry[type];
}

module.exports = { getHandler };