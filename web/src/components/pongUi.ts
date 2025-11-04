export type MountedPongScene = {
    container: HTMLDivElement;
    canvas: HTMLCanvasElement;
    canvasWrapper: HTMLDivElement;
    countdown: HTMLDivElement;
    timerDisplay: HTMLDivElement;
    timer: { start: () => void; stop: () => void };
    scoreLeft: HTMLDivElement;
    scoreRight: HTMLDivElement;
    scoreLeftName: HTMLDivElement;
    scoreRightName: HTMLDivElement;
};

export function createPongCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    canvas.className = 'rounded-2xl shadow-xl border border-white/20';
    return canvas;
}

export function createPongContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className =
        'relative flex items-center justify-center min-h-screen w-full text-white overflow-hidden';
    return container;
}

export function createCanvasWrapper(canvas: HTMLCanvasElement): HTMLDivElement {
    const wrap = document.createElement('div');
    wrap.className = 'relative flex items-center justify-center p-4';
    wrap.appendChild(canvas);
    return wrap;
}

export function createScoreOverlay() {
    const wrapper = document.createElement('div');
    wrapper.className =
        'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10';

    const makeSide = () => {
        const root = document.createElement('div');
        root.className = 'flex flex-col text-center';
        const name = document.createElement('div');
        const score = document.createElement('div');
        name.textContent = '';
        score.textContent = '0';
        root.append(name, score);
        return { root, name, score };
    };

    const left = makeSide();
    const right = makeSide();
    wrapper.append(left.root, right.root);

    return {
        wrapper,
        left,
        right,
    };
}

export function createCountdownOverlay(): HTMLDivElement {
    const div = document.createElement('div');
    div.className =
        'absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold pointer-events-none transition-all z-10';
    return div;
}

export function createTimerDisplay(): HTMLDivElement {
    const div = document.createElement('div');
    div.className =
        'absolute top-4 right-4 text-white text-xl font-mono z-10 pointer-events-none';
    div.textContent = '00:00';
    return div;
}

export function makeMatchTimer(display: HTMLElement) {
    let interval: number | undefined;

    function start() {
        stop();
        const startTime = Date.now();
        interval = window.setInterval(() => {
            const s = Math.floor((Date.now() - startTime) / 1000);
            const mm = String(Math.floor(s / 60)).padStart(2, '0');
            const ss = String(s % 60).padStart(2, '0');
            display.textContent = `${mm}:${ss}`;
        }, 250);
    }

    function stop() {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        display.textContent = '00:00';
    }

    return { start, stop };
}

export function launchCountdown(container: HTMLElement, onComplete: () => void) {
    const sequence = ['3', '2', '1', 'GO!'];
    let index = 0;
    const interval = setInterval(() => {
        container.textContent = sequence[index];
        container.style.opacity = '1';
        container.style.transform = 'scale(1.1)';

        setTimeout(() => {
            container.style.opacity = '0';
            container.style.transform = 'scale(1)';
        }, 400);

        index++;
        if (index === sequence.length) {
            clearInterval(interval);
            setTimeout(onComplete, 400);
        }
    }, 1000);
}

export function mountPlayScene(host: HTMLElement): MountedPongScene {
    const container = createPongContainer();
    const canvas = createPongCanvas();
    const canvasWrapper = createCanvasWrapper(canvas);
    const countdown = createCountdownOverlay();
    const score = createScoreOverlay();
    const timerDisplay = createTimerDisplay();
    const timer = makeMatchTimer(timerDisplay);

    container.append(canvasWrapper, countdown, score.wrapper, timerDisplay);
    host.appendChild(container);

    return {
        container,
        canvas,
        canvasWrapper,
        countdown,
        timerDisplay,
        timer,
        scoreLeft: score.left.score,
        scoreRight: score.right.score,
        scoreLeftName: score.left.name,
        scoreRightName: score.right.name,
    };
}