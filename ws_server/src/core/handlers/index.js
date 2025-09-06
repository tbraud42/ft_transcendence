import auth from './auth.js'
import ping from './ping.js'
import join from './join.js'
import input from './input.js'

const registry = {
    [auth.type]: auth,
    [ping.type]: ping,
    [join.type]: join,
    [input.type]: input,
}

/**
 * @param {string} type
 */
export function getHandler(type) {
    return registry[type]
}
