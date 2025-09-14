import { bubble, setBubble } from './Bubble'

type Player = { username: string; connected: boolean; isBot?: boolean }
type Match = {
    id: string
    round: number
    p1: string | null
    p2: string | null
    status: 'waiting' | 'running' | 'finished'
    winner?: string | null
}
type Snapshot = {
    type: 'snapshot'
    name: string
    tournamentId: string
    maxPlayers: number
    players: Player[]
    matches: Match[]
}

export function renderBracket(host: HTMLElement, snap: Snapshot) {
    host.innerHTML = ''

    const outer = div('w-full flex justify-center')
    host.append(outer)

    const card = div('w-full max-w-[1400px] rounded-2xl border border-white/10 bg-white/[0.04] p-4')
    outer.append(card)

    const title = div('text-base font-semibold mb-2')
    title.textContent = snap.name || `Tournament #${snap.tournamentId}`
    card.append(title)

    const scene = div('relative overflow-auto rounded-xl border border-white/10 h-[600px] flex justify-center items-center')
    card.append(scene)

    const stage = div('relative')
    scene.append(stage)

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('data-connectors', '1')
    svg.style.position = 'absolute'
    scene.append(svg)

    const max = pow2ceil(Math.max(2, snap.maxPlayers || (snap.players?.length ?? 2)))
    const perSide = max / 2

    const W = 160, H = 34, GX = 72, GY = 14, PAD = 14
    const CENTER = 260
    const rounds = Math.log2(perSide) + 1
    const leftWidth  = (rounds - 1) * (W + GX)
    const rightWidth = (rounds - 1) * (W + GX)
    const totalW = leftWidth + CENTER + rightWidth + W + PAD * 2
    const ladderH = perSide * (H + GY) - GY
    const finalBlock = H + 26
    const totalH = PAD + finalBlock + ladderH + PAD

    stage.style.width = `${totalW}px`
    stage.style.height = `${totalH}px`

    const xL = (lvl: number) => PAD + lvl * (W + GX)
    const xR = (lvl: number) => PAD + leftWidth + CENTER + (rounds - 1 - lvl) * (W + GX)
    const yBase = PAD + (H + 18)
    const stepY = (lvl: number) => (H + GY) * (1 << lvl)

    const pos = (el: HTMLElement) => ({ x: +el.style.left.replace('px',''), y: +el.style.top.replace('px','') })

    const L: HTMLElement[][] = []
    const R: HTMLElement[][] = []

    L[0] = []; R[0] = []
    for (let i = 0; i < perSide; i++) {
        L[0].push(bubble(stage, xL(0), yBase + i * stepY(0), W, H))
        R[0].push(bubble(stage, xR(0), yBase + i * stepY(0), W, H))
    }

    for (let lvl = 1; lvl < rounds; lvl++) {
        const prevL = L[lvl - 1], prevR = R[lvl - 1]
        const count = prevL.length >> 1
        const curL: HTMLElement[] = [], curR: HTMLElement[] = []
        for (let i = 0; i < count; i++) {
            const aL = prevL[i * 2], bL = prevL[i * 2 + 1]
            const yL = Math.round((pos(aL).y + pos(bL).y) / 2)
            curL.push(bubble(stage, xL(lvl), yL, W, H))

            const aR = prevR[i * 2], bR = prevR[i * 2 + 1]
            const yR = Math.round((pos(aR).y + pos(bR).y) / 2)
            curR.push(bubble(stage, xR(lvl), yR, W, H))
        }
        L[lvl] = curL
        R[lvl] = curR
    }

    const centerX = PAD + leftWidth + CENTER / 2 + W / 2
    const finalBox = bubble(stage, centerX - W / 2, PAD, W, H)
    setBubble(finalBox, 'Winner', 'empty')

    const players = new Map<string, Player>()
    snap.players.forEach((p) => players.set(p.username, p))

    const r1 = (snap.matches || []).filter((m) => (m.round ?? 1) === 1)
    if (perSide === 1 && r1.length >= 1) {
        const m = r1[0]
        const v = (u: string | null): Variant => u ? (players.get(u)?.connected ? 'connected' : 'offline') : 'empty'
        setBubble(L[0][0], m.p1, v(m.p1))
        setBubble(R[0][0], m.p2, v(m.p2))
    } else {
        for (let i = 0; i < perSide; i++) {
            const leftPair  = r1[i * 2]     || { p1: null, p2: null, status: 'waiting' as const }
            const rightPair = r1[i * 2 + 1] || { p1: null, p2: null, status: 'waiting' as const }
            fillPair(L[0], i, leftPair, players)
            fillPair(R[0], i, rightPair, players)
        }
    }

    const draw = () => {
        const sceneRect = scene.getBoundingClientRect()
        const stageRect = stage.getBoundingClientRect()
        const left = stageRect.left - sceneRect.left
        const top  = stageRect.top  - sceneRect.top

        svg.style.left = `${left}px`
        svg.style.top  = `${top}px`
        svg.setAttribute('width',  `${stageRect.width}`)
        svg.setAttribute('height', `${stageRect.height}`)
        svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`)
        svg.innerHTML = ''

        for (let lvl = 0; lvl < L.length - 1; lvl++) {
            connectLevel(svg, stageRect, L[lvl], L[lvl + 1], 'left')
        }
        for (let lvl = 0; lvl < R.length - 1; lvl++) {
            connectLevel(svg, stageRect, R[lvl], R[lvl + 1], 'right')
        }

        const leftRoot  = L[L.length - 1]?.[0] || null
        const rightRoot = R[R.length - 1]?.[0] || null
        if (leftRoot)  {
            connectRootToFinal(svg, stageRect, leftRoot,  finalBox, 'left')
        }
        if (rightRoot) {
            connectRootToFinal(svg, stageRect, rightRoot, finalBox, 'right')
        }
    }

    requestAnimationFrame(() => requestAnimationFrame(draw))
    const ro = new ResizeObserver(() => requestAnimationFrame(draw))
    ro.observe(scene); ro.observe(stage)
}

/* ---------------- Connectors ---------------- */

function connectLevel(
    svg: SVGSVGElement,
    stageRect: DOMRect,
    fromLevel: HTMLElement[],
    toLevel: HTMLElement[],
    side: 'left' | 'right'
) {
    const centerLeft  = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();  return { x: r.left  - stageRect.left, y: r.top - stageRect.top + r.height/2 } 
    }
    const centerRight = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();  return { x: r.right - stageRect.left, y: r.top - stageRect.top + r.height/2 } 
    }

    for (let i = 0; i < fromLevel.length; i += 2) {
        const a = fromLevel[i], b = fromLevel[i + 1], p = toLevel[Math.floor(i/2)]
        if (!a || !b || !p) {
            continue
        }

        const A = side === 'left' ? centerRight(a) : centerLeft(a)
        const B = side === 'left' ? centerRight(b) : centerLeft(b)
        const P = side === 'left' ? centerLeft(p)  : centerRight(p)
        const midY = (A.y + B.y) / 2

        elbow(svg, A.x, A.y, P.x, midY)
        elbow(svg, B.x, B.y, P.x, midY)
    }
}

function connectRootToFinal(
    svg: SVGSVGElement,
    stageRect: DOMRect,
    root: HTMLElement,
    finalBox: HTMLElement,
    side: 'left' | 'right'
) {
    const r = root.getBoundingClientRect()
    const f = finalBox.getBoundingClientRect()

    const startX = side === 'left' ? r.right - stageRect.left : r.left - stageRect.left
    const startY = r.top - stageRect.top + r.height / 2

    const endX = f.left - stageRect.left + f.width / 2
    const endY = f.top - stageRect.top + f.height

    elbowUpTo(svg, startX, startY, endX, endY, 2)
}

function elbow(svg: SVGSVGElement, ax: number, ay: number, bx: number, by: number, w = 2) {
    if (!Number.isFinite(ax + ay + bx + by)) {
        return
    }
    const midX = (ax + bx) / 2
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', `M ${ax} ${ay} H ${midX} V ${by} H ${bx}`)
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', 'currentColor')
    p.setAttribute('stroke-width', String(w))
    p.setAttribute('opacity', '0.9')
    svg.appendChild(p)
}

function elbowUpTo(svg: SVGSVGElement, ax: number, ay: number, bx: number, by: number, w = 2) {
    if (!Number.isFinite(ax + ay + bx + by)) {
        return
    }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', `M ${ax} ${ay} H ${bx} V ${by}`)
    p.setAttribute('fill', 'none')
    p.setAttribute('stroke', 'currentColor')
    p.setAttribute('stroke-width', String(w))
    p.setAttribute('opacity', '0.9')
    svg.appendChild(p)
}

/* ---------------- Data helpers ---------------- */

function fillPair(leaves: HTMLElement[], idx: number, m: Match, map: Map<string, Player>) {
    const top = leaves[idx * 2], bot = leaves[idx * 2 + 1]
    if (!top || !bot) {
        return
    }
    const s1: Variant = m.p1 ? (map.get(m.p1)?.connected ? 'connected' : 'offline') : 'empty'
    const s2: Variant = m.p2 ? (map.get(m.p2)?.connected ? 'connected' : 'offline') : 'empty'
    setBubble(top, m.p1, s1)
    setBubble(bot, m.p2, s2)
}

/* ---------------- Utils ---------------- */

const pow2ceil = (n: number) => {
    let p = 1; while (p < n) {
        p <<= 1;
    } return p 
}
function div(cls: string) {
    const d = document.createElement('div'); d.className = cls; return d 
}
export type Variant = 'empty' | 'connected' | 'ready' | 'offline' | 'playing' | 'winner' | 'eliminated'