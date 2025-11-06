import { bubble, setBubble } from '../Bubble'
import { LeafAddress, Match, Player, RenderOptions } from '../../api/socket/types'
import { SrvSnapshot } from '../../api/socket/messageTypes'
import { MatchStatus, ClientStatus } from '../../api/socket/protocol'

const W = 176, H = 38, GX = 72, GY = 14, PAD = 14, CENTER = 260

export function geometry(perSide: number) {
    const rounds = Math.log2(perSide) + 1
    const leftWidth  = (rounds - 1) * (W + GX)
    const rightWidth = (rounds - 1) * (W + GX)
    const totalW = leftWidth + CENTER + rightWidth + W + PAD * 2
    const ladderH = perSide * (H + GY) - GY
    const finalBlock = H + 26
    const totalH = PAD + finalBlock + ladderH + PAD

    const xL = (lvl: number) => PAD + lvl * (W + GX)
    const xR = (lvl: number) => PAD + leftWidth + CENTER + (rounds - 1 - lvl) * (W + GX)
    const yBase = PAD + (H + 18)
    const stepY = (lvl: number) => (H + GY) * (1 << lvl)

    return { W, H, PAD, rounds, totalW, totalH, xL, xR, yBase, stepY, leftWidth }
}

export function pow2ceil(n: number) {
    let p = 1
    while (p < n) {
        p <<= 1
    }
    return p
}

export function buildLevels(stage: HTMLElement, perSide: number) {
    const g = geometry(perSide)
    const L: HTMLElement[][] = []
    const R: HTMLElement[][] = []

    L[0] = []; R[0] = []
    for (let i = 0; i < perSide; i++) {
        L[0].push(bubble(stage, g.xL(0), g.yBase + i * g.stepY(0), g.W, g.H))
        R[0].push(bubble(stage, g.xR(0), g.yBase + i * g.stepY(0), g.W, g.H))
    }

    const pos = (el: HTMLElement) => ({
        x: +el.style.left.replace('px',''),
        y: +el.style.top.replace('px',''),
    })

    for (let lvl = 1; lvl < g.rounds; lvl++) {
        const prevL = L[lvl - 1], prevR = R[lvl - 1]
        const count = prevL.length >> 1
        const curL: HTMLElement[] = [], curR: HTMLElement[] = []
        for (let i = 0; i < count; i++) {
            const aL = prevL[i * 2], bL = prevL[i * 2 + 1]
            const yL = Math.round((pos(aL).y + pos(bL).y) / 2)
            curL.push(bubble(stage, g.xL(lvl), yL, g.W, g.H))

            const aR = prevR[i * 2], bR = prevR[i * 2 + 1]
            const yR = Math.round((pos(aR).y + pos(bR).y) / 2)
            curR.push(bubble(stage, g.xR(lvl), yR, g.W, g.H))
        }
        L[lvl] = curL
        R[lvl] = curR
    }

    const centerX = PAD + g.leftWidth + CENTER / 2 + g.W / 2
    const finalBox = bubble(stage, centerX - g.W / 2, PAD, g.W, g.H)
    setBubble(finalBox, 'Winner', ClientStatus.EMPTY)

    return { L, R, finalBox, g }
}
