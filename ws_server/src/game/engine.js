// Moteur de jeu côté serveur (autoritaire)
export const WIDTH = 900;
export const HEIGHT = 600;
export const PADDLE_W = 16;
export const PADDLE_H = 96;
export const BALL_SIZE = 12;

function speedsFor(difficulty) {
    switch (difficulty) {
        case "hard":   return { paddle: 9,  ball: 7.5 };
        case "medium": return { paddle: 8,  ball: 6.5 };
        default:       return { paddle: 7.5, ball: 6.0 };
    }
}

export function newState(difficulty = "easy") {
    const speed = speedsFor(difficulty);
    return {
        width: WIDTH,
        height: HEIGHT,
        paddleW: PADDLE_W,
        paddleH: PADDLE_H,
        ballSize: BALL_SIZE,
        paddles: [
            { y: HEIGHT / 2 - PADDLE_H / 2, vy: 0 },
            { y: HEIGHT / 2 - PADDLE_H / 2, vy: 0 }
        ],
        ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 },
        scores: [0, 0],
        running: false,
        speed // { paddle, ball }
    };
}

export function serveBall(state) {
    state.ball.x = state.width / 2;
    state.ball.y = state.height / 2;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8; // +/- 22.5°
    state.ball.vx = Math.cos(angle) * state.speed.ball * dir;
    state.ball.vy = Math.sin(angle) * state.speed.ball;
    state.running = true;
}

export function tick(state) {
    // Paddles
    for (const p of state.paddles) {
        p.y += p.vy;
        if (p.y < 0) p.y = 0;
        if (p.y > state.height - state.paddleH) p.y = state.height - state.paddleH;
    }

    // Ball
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    // Bords haut/bas
    if (state.ball.y <= 0 || state.ball.y >= state.height - state.ballSize) {
        state.ball.vy *= -1;
        state.ball.y = Math.max(0, Math.min(state.height - state.ballSize, state.ball.y));
    }

    // Collisions raquettes
    // Left
    if (state.ball.x <= PADDLE_W &&
        state.ball.y + BALL_SIZE >= state.paddles[0].y &&
        state.ball.y <= state.paddles[0].y + PADDLE_H &&
        state.ball.vx < 0) {
        state.ball.vx *= -1;
        const hit = (state.ball.y + BALL_SIZE / 2) - (state.paddles[0].y + PADDLE_H / 2);
        state.ball.vy = hit * 0.25;
        state.ball.x = PADDLE_W;
    }
    // Right
    if (state.ball.x + BALL_SIZE >= state.width - PADDLE_W &&
        state.ball.y + BALL_SIZE >= state.paddles[1].y &&
        state.ball.y <= state.paddles[1].y + PADDLE_H &&
        state.ball.vx > 0) {
        state.ball.vx *= -1;
        const hit = (state.ball.y + BALL_SIZE / 2) - (state.paddles[1].y + PADDLE_H / 2);
        state.ball.vy = hit * 0.25;
        state.ball.x = state.width - PADDLE_W - BALL_SIZE;
    }

    // Points
    if (state.ball.x < -BALL_SIZE) {
        state.scores[1] += 1;
        serveBall(state);
    } else if (state.ball.x > state.width + BALL_SIZE) {
        state.scores[0] += 1;
        serveBall(state);
    }
}