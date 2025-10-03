export function createSvg(stage: HTMLElement, totalW: number, totalH: number) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('absolute', 'inset-0', 'pointer-events-none');
    svg.setAttribute('width',  String(totalW));
    svg.setAttribute('height', String(totalH));
    svg.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
    stage.append(svg);
    return svg;
}

export function draw(svg: SVGSVGElement, stage: HTMLElement, L: HTMLElement[][], R: HTMLElement[][], finalBox: HTMLElement) {
    svg.innerHTML = '';
    const rect = stage.getBoundingClientRect();

    for (let lvl = 0; lvl < L.length - 1; lvl++) {
        connectLevel(svg, rect, L[lvl], L[lvl + 1], 'left');
    }
    for (let lvl = 0; lvl < R.length - 1; lvl++) {
        connectLevel(svg, rect, R[lvl], R[lvl + 1], 'right');
    }

    const leftRoot  = L[L.length - 1]?.[0] || null;
    const rightRoot = R[R.length - 1]?.[0] || null;
    if (leftRoot)  {
        connectRootToFinal(svg, rect, leftRoot,  finalBox, 'left');
    }
    if (rightRoot) {
        connectRootToFinal(svg, rect, rightRoot, finalBox, 'right');
    }
}

function centerLeft (el: HTMLElement, stageRect: DOMRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left  - stageRect.left, y: r.top - stageRect.top + r.height/2 };
}
function centerRight(el: HTMLElement, stageRect: DOMRect) {
    const r = el.getBoundingClientRect();
    return { x: r.right - stageRect.left, y: r.top - stageRect.top + r.height/2 };
}

function connectLevel(
    svg: SVGSVGElement,
    stageRect: DOMRect,
    fromLevel: HTMLElement[],
    toLevel: HTMLElement[],
    side: 'left' | 'right'
) {
    for (let i = 0; i < fromLevel.length; i += 2) {
        const a = fromLevel[i], b = fromLevel[i + 1], p = toLevel[Math.floor(i/2)];
        if (!a || !b || !p) {
            continue;
        }

        const A = side === 'left' ? centerRight(a, stageRect) : centerLeft(a, stageRect);
        const B = side === 'left' ? centerRight(b, stageRect) : centerLeft(b, stageRect);
        const P = side === 'left' ? centerLeft(p, stageRect)  : centerRight(p, stageRect);
        const midY = (A.y + B.y) / 2;

        elbow(svg, A.x, A.y, P.x, midY);
        elbow(svg, B.x, B.y, P.x, midY);
    }
}

function connectRootToFinal(
    svg: SVGSVGElement,
    stageRect: DOMRect,
    root: HTMLElement,
    finalBox: HTMLElement,
    side: 'left' | 'right'
) {
    const r = root.getBoundingClientRect();
    const f = finalBox.getBoundingClientRect();

    const startX = side === 'left' ? r.right - stageRect.left : r.left - stageRect.left;
    const startY = r.top - stageRect.top + r.height / 2;

    const endX   = f.left - stageRect.left + f.width / 2;
    const endY   = f.top  - stageRect.top  + f.height;

    elbowUpTo(svg, startX, startY, endX, endY, 2);
}

function elbow(svg: SVGSVGElement, ax: number, ay: number, bx: number, by: number, w = 2) {
    if (!Number.isFinite(ax + ay + bx + by)) {
        return;
    }
    const midX = (ax + bx) / 2;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M ${ax} ${ay} H ${midX} V ${by} H ${bx}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', String(w));
    p.setAttribute('opacity', '0.9');
    svg.appendChild(p);
}

function elbowUpTo(svg: SVGSVGElement, ax: number, ay: number, bx: number, by: number, w = 2) {
    if (!Number.isFinite(ax + ay + bx + by)) {
        return;
    }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M ${ax} ${ay} H ${bx} V ${by}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', String(w));
    p.setAttribute('opacity', '0.9');
    svg.appendChild(p);
}