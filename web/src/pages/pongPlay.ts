import { DEFAULT_BALL_RADIUS, PongGame } from '../games/pong/engine/PongGame';
import i18n from '../utils/lang/i18n';
import { createButton } from '../components/button';
import { GameMode, secondPlayerName, selectedDifficulty, selectedGameMode } from '../games/pong/pongState';
import { LocalPlayer } from '../games/pong/engine/players/LocalPlayer';
import { AiPlayer } from '../games/pong/engine/players/AiPlayer';
import { getUsername } from '../utils/storage';
import { navigateTo } from '../utils/router';
import { mountPlayScene, launchCountdown } from '../components/pongUi';

let currentGame: PongGame | null = null;

export function renderPongPlay(_roomId: string): HTMLElement {
    document.body.classList.add('pong-mode');
    if (currentGame) { currentGame.stop(); currentGame = null; }

    const container = document.createElement('div'); // host
    const {
        canvas,
        container: playRoot,
        countdown,
        scoreLeft,
        scoreRight,
        timer
    } = mountPlayScene(container);

    const exitBtn = createExitButton(() => {
        document.body.classList.remove('pong-mode');
        navigateTo('/home');
        timer.stop();
        if (currentGame) { currentGame.stop(); currentGame = null; }
    });
    exitBtn.classList.add('absolute', 'top-4', 'left-4', 'w-32', 'z-20');
    playRoot.appendChild(exitBtn);

    const mode = selectedGameMode;
    let game: PongGame;

    if (mode === GameMode.AI) {
        const p1 = new LocalPlayer(true, canvas, getUsername() || i18n.t('pong_you'));
        const p2 = new AiPlayer(false, canvas, i18n.t('pong_ai_opponent'), selectedDifficulty);

        game = new PongGame('local', canvas, p1, p2, selectedDifficulty, DEFAULT_BALL_RADIUS, scoreLeft, scoreRight);
        currentGame = game;
        game.start();

        launchCountdown(countdown, () => {
            countdown.remove();
            game.startBall();
            timer.start();
        });

        return container;
    }

    if (mode === GameMode.LOCAL) {
        const p1 = new LocalPlayer(true, canvas, getUsername() || i18n.t('pong_you'));
        const p2 = new LocalPlayer(false, canvas, secondPlayerName || i18n.t('pong_opponent'));

        game = new PongGame('local', canvas, p1, p2, selectedDifficulty, DEFAULT_BALL_RADIUS, scoreLeft, scoreRight);
        currentGame = game;
        game.start();

        launchCountdown(countdown, () => {
            countdown.remove();
            game.startBall();
            timer.start();
        });

        return container;
    }

    return container;
}

function createExitButton(onConfirm: () => void): HTMLButtonElement {
    const btn = createButton(i18n.t('button_exit'), 'button', 'red');
    btn.className = btn.className.replace('w-full', '');
    let confirmMode = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const reset = () => {
        confirmMode = false;
        btn.textContent = i18n.t('button_exit');
        if (timeout) { clearTimeout(timeout); timeout = null; }
    };

    btn.onclick = () => {
        if (!confirmMode) {
            confirmMode = true;
            btn.textContent = i18n.t('button_exit_confirm');
            timeout = setTimeout(reset, 3000);
        } else {
            onConfirm();
        }
    };

    btn.onmouseleave = reset;
    return btn;
}