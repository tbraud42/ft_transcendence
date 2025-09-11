import { createBubble, setBubbleLabel, setBubbleVariant } from './Bubble';

export type MatchScore = { s1: number; s2: number };

type NodeId = string;
type Side = 'left' | 'right';

type MatchNode = {
    id: NodeId;
    side: Side;
    round: number;
    index: number;
    el: HTMLDivElement;
    name?: string | null;
};

type BracketOptions = {
    width?: number;
    height?: number;
    gapX?: number;
    gapY?: number;
    pad?: number;
    centerClear?: number;
    minHeight?: number;
};

type PairSlot = { side: Side; pairIndex: number; top: MatchNode; bottom: MatchNode; parent: MatchNode };

export default class BracketView {
    private root: HTMLElement;
    private scene: HTMLElement;
    private stage: HTMLElement;
    private svg: SVGSVGElement;

    private W: number;
    private H: number;
    private GX: number;
    private GY: number;
    private PAD: number;
    private CENTER: number;
    private MINH: number;

    private seeded = false;
    private pow2 = 2;
    private perSide = 1;
    private roundsPerSide = 1;

    private leftRounds: MatchNode[][] = [];
    private rightRounds: MatchNode[][] = [];
    private nodes = new Map<NodeId, MatchNode>();
    private finalBubble: HTMLDivElement | null = null;

    private matchToPair = new Map<string, PairSlot>();

    constructor(root: HTMLElement, opts: BracketOptions = {}) {
        this.root   = root;
        this.W      = opts.width  ?? 220;
        this.H      = opts.height ?? 64;
        this.GX     = opts.gapX   ?? 140;
        this.GY     = opts.gapY   ?? 36;
        this.PAD    = opts.pad    ?? 32;
        this.CENTER = opts.centerClear ?? 240;
        this.MINH   = opts.minHeight ?? 420;

        this.root.innerHTML = `
      <div class="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div class="scene relative overflow-auto rounded-xl border border-slate-800 bg-slate-950/20
                    flex items-center justify-center p-6" style="min-height:${this.MINH}px">
          <div class="stage relative"></div>
        </div>
      </div>
    `;
        this.scene = this.root.querySelector('.scene') as HTMLDivElement;
        this.stage = this.root.querySelector('.stage') as HTMLDivElement;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        this.svg.classList.add('absolute','inset-0');
        (this.svg as any).style.pointerEvents = 'none';
        this.stage.appendChild(this.svg);

        this.computeDimensions(2);
        this.renderSkeleton();
    }

    setMaxPlayers(maxPlayers: number) {
        const wanted = this.pow2Ceil(Math.max(2, maxPlayers || 2));
        if (wanted === this.pow2) return;

        const savedPairs: Array<{ matchId: string; top?: string; bottom?: string; parent?: string }> = [];
        for (const [matchId, slot] of this.matchToPair.entries()) {
            savedPairs.push({
                matchId,
                top: slot.top.name || '—',
                bottom: slot.bottom.name || '—',
                parent: slot.parent?.name || undefined,
            });
        }
        const finalName = this.finalBubble?.textContent?.startsWith('🏆')
            ? this.finalBubble.textContent!
            : undefined;

        this.computeDimensions(wanted);
        this.renderSkeleton();

        for (const p of savedPairs) {
            this.setPair(p.matchId, p.top, p.bottom);
            if (p.parent && p.parent !== '—') this.setWinner(p.matchId, p.parent);
        }
        if (finalName) setBubbleLabel(this.finalBubble!, finalName);
    }

    setPlayers(list: string[]) {
        if (this.seeded) return;
        const n = this.pow2Ceil(Math.max(2, list.length || 2));
        this.computeDimensions(n);
        this.renderSkeleton();
        this.seeded = true;

        let i = 0;
        for (const name of list) this.fillNextLeaf(name, i++);
    }

    setPair(matchId: string, topName?: string, bottomName?: string) {
        if (!matchId) return;

        const mapped = this.matchToPair.get(matchId);
        if (mapped) {
            setBubbleLabel(mapped.top.el, topName || '—');   mapped.top.name = topName || '—';
            setBubbleLabel(mapped.bottom.el, bottomName || '—'); mapped.bottom.name = bottomName || '—';
            this.updateLines(); return;
        }

        const slot = this.findEmptyPairSlot() || this.firstPairSlot();
        if (!slot) return;

        setBubbleLabel(slot.top.el, topName || '—');       slot.top.name = topName || '—';
        setBubbleLabel(slot.bottom.el, bottomName || '—'); slot.bottom.name = bottomName || '—';

        this.matchToPair.set(matchId, slot);
        this.updateLines();
    }

    setWinner(matchId: string, winner: string, _score?: MatchScore | null) {
        const slot = this.matchToPair.get(matchId);
        if (!slot) return;

        const topName = slot.top.name || '—';
        const botName = slot.bottom.name || '—';

        if (winner === topName) { setBubbleVariant(slot.top.el, 'winner'); setBubbleVariant(slot.bottom.el, 'eliminated'); }
        else if (winner === botName) { setBubbleVariant(slot.bottom.el, 'winner'); setBubbleVariant(slot.top.el, 'eliminated'); }

        setBubbleLabel(slot.parent.el, winner || '—');
        slot.parent.name = winner || '—';

        this.updateLines();
    }

    setFinalWinner(username: string) {
        if (!this.finalBubble) return;
        setBubbleLabel(this.finalBubble, `🏆 ${username}`);
    }

    markEliminated(username: string) {
        if (!username) return;
        const leaves = [...(this.leftRounds[0]||[]), ...(this.rightRounds[0]||[])];
        for (const leaf of leaves) {
            if ((leaf.name || '') === username) { setBubbleVariant(leaf.el, 'eliminated'); break; }
        }
    }

    private computeDimensions(pow2: number) {
        this.pow2 = pow2;
        this.perSide = this.pow2 / 2;
        this.roundsPerSide = (Math.log2(this.perSide) + 1) | 0;
    }

    private renderSkeleton() {
        this.stage.innerHTML = '';
        this.stage.appendChild(this.svg);
        this.nodes.clear();
        this.leftRounds = [];
        this.rightRounds = [];
        this.matchToPair.clear();
        this.finalBubble = null;

        const leftWidth  = (this.roundsPerSide - 1) * (this.W + this.GX);
        const rightWidth = (this.roundsPerSide - 1) * (this.W + this.GX);
        const totalW = leftWidth + this.CENTER + rightWidth + this.W + this.PAD * 2;

        const ladderH = this.perSide * (this.H + this.GY) - (this.perSide > 0 ? this.GY : 0);
        const finalBlock = this.H + 48;
        const totalH = this.PAD + finalBlock + ladderH + this.PAD;

        this.stage.style.width = `${totalW}px`;
        this.stage.style.height = `${Math.max(totalH, this.MINH)}px`;

        this.svg.setAttribute('viewBox', `0 0 ${totalW} ${Math.max(totalH, this.MINH)}`);
        this.svg.setAttribute('width', String(totalW));
        this.svg.setAttribute('height', String(Math.max(totalH, this.MINH)));

        const xLeft  = (lvl: number) => this.PAD + lvl * (this.W + this.GX);
        const xRight = (lvl: number) => this.PAD + leftWidth + this.thisCENTER() + (this.roundsPerSide - 1 - lvl) * (this.W + this.GX);
        const yBase  = this.PAD + (this.H + 32);
        const stepY  = (lvl: number) => (this.H + this.GY) * (1 << lvl);

        for (let i = 0; i < this.perSide; i++) {
            const l = this.createNode(this.idL(0,i),'left',0,i,'—');
            const r = this.createNode(this.idR(0,i),'right',0,i,'—');
            l.el.style.left = `${xLeft(0)}px`;  l.el.style.top = `${yBase + i*stepY(0)}px`;
            r.el.style.left = `${xRight(0)}px`; r.el.style.top = `${yBase + i*stepY(0)}px`;
        }

        for (let lvl=1; lvl<this.roundsPerSide; lvl++) {
            const len = this.perSide >> lvl;
            for (let i=0;i<len;i++) {
                const nl = this.createNode(this.idL(lvl,i),'left', lvl,i,'—');
                const nr = this.createNode(this.idR(lvl,i),'right',lvl,i,'—');
                nl.el.style.left = `${xLeft(lvl)}px`;  nl.el.style.top = `${yBase + i*stepY(lvl)}px`;
                nr.el.style.left = `${xRight(lvl)}px`; nr.el.style.top = `${yBase + i*stepY(lvl)}px`;
            }
        }

        const centerX = this.PAD + leftWidth + this.CENTER/2 + this.W/2;
        const finalX  = centerX - this.W/2;
        const finalY  = this.PAD;
        this.finalBubble = createBubble({ label: 'Winner', width: this.W, height: this.H });
        this.finalBubble.style.left = `${finalX}px`;
        this.finalBubble.style.top  = `${finalY}px`;
        this.stage.appendChild(this.finalBubble);

        this.updateLines();
    }

    private thisCENTER(){ return this.CENTER; }

    private createNode(id: NodeId, side: Side, round: number, index: number, label: string): MatchNode {
        const el = createBubble({ label, width: this.W, height: this.H });
        this.stage.appendChild(el);
        const node: MatchNode = { id, side, round, index, el, name: label };
        const rounds = side === 'left' ? this.leftRounds : this.rightRounds;
        if (!rounds[round]) rounds[round] = [];
        rounds[round][index] = node;
        this.nodes.set(id, node);
        return node;
    }

    private idL(l:number,i:number){ return `L${l}-${i}`; }
    private idR(l:number,i:number){ return `R${l}-${i}`; }

    private firstPairSlot(): PairSlot | null {
        return this.pairSlotAt('left',0) || this.pairSlotAt('right',0) || null;
    }
    private findEmptyPairSlot(): PairSlot | null {
        const len = Math.max(1, this.perSide/2|0);
        for (let i=0;i<len;i++) {
            const L = this.pairSlotAt('left',i);  if (L && this.isPairEmpty(L)) return L;
            const R = this.pairSlotAt('right',i); if (R && this.isPairEmpty(R)) return R;
        }
        return null;
    }
    private isPairEmpty(slot: PairSlot){ return (!slot.top.name || slot.top.name==='—') && (!slot.bottom.name || slot.bottom.name==='—'); }
    private pairSlotAt(side:Side,pairIndex:number): PairSlot|null {
        const leaves = (side==='left'?this.leftRounds:this.rightRounds)[0]||[];
        const top = leaves[pairIndex*2];
        const bottom = leaves[pairIndex*2+1];
        const parent = (side==='left'?this.leftRounds:this.rightRounds)[1]?.[pairIndex] ?? (
            (side==='left'?this.leftRounds:this.rightRounds)[0]?.[pairIndex]
        );
        if (!top || !bottom) return null;
        if (!parent && this.perSide===1) {
            const fake: MatchNode = { id:`${side}-root`, side, round:1, index:0, el:this.finalBubble as any, name: this.finalBubble?.textContent ?? 'Winner' };
            return { side, pairIndex, top, bottom, parent: fake };
        }
        if (!parent) return null;
        return { side, pairIndex, top, bottom, parent };
    }

    private fillNextLeaf(label: string, preferIndex?: number) {
        const L0 = this.leftRounds[0]||[], R0 = this.rightRounds[0]||[];

        const tryIdx = (arr:MatchNode[], idx?:number) => (idx!=null && arr[idx] && (!arr[idx].name || arr[idx].name==='—')) ? arr[idx] : null;

        const target =
            tryIdx(L0, preferIndex) || L0.find(n => !n.name || n.name==='—') ||
            tryIdx(R0, preferIndex) || R0.find(n => !n.name || n.name==='—') || null;

        if (target) { setBubbleLabel(target.el,label); target.name = label; this.updateLines(); }
    }

    private updateLines() {
        this.svg.innerHTML = '';
        const line = (x1:number,y1:number,x2:number,y2:number,w=2) => {
            const e = document.createElementNS('http://www.w3.org/2000/svg','line');
            e.setAttribute('x1',String(x1)); e.setAttribute('y1',String(y1));
            e.setAttribute('x2',String(x2)); e.setAttribute('y2',String(y2));
            e.setAttribute('stroke','currentColor'); e.setAttribute('stroke-width',String(w));
            e.setAttribute('opacity','0.9'); this.svg.appendChild(e);
        };

        for (let lvl=0; lvl<this.roundsPerSide-1; lvl++) {
            const nodes = this.leftRounds[lvl]||[], parents = this.leftRounds[lvl+1]||[];
            for (let i=0;i<nodes.length;i+=2) {
                const a=nodes[i], b=nodes[i+1], p=parents[i/2]; if (!a||!b||!p) continue;
                const ax = parseFloat(a.el.style.left)+this.W, ay = parseFloat(a.el.style.top)+this.H/2;
                const bx = parseFloat(b.el.style.left)+this.W, by = parseFloat(b.el.style.top)+this.H/2;
                const px = parseFloat(p.el.style.left),      py = parseFloat(p.el.style.top)+this.H/2;
                const midX = (parseFloat(a.el.style.left)+this.W)+this.GX/2;
                line(ax,ay,midX,ay); line(bx,by,midX,by); line(midX,Math.min(ay,by),midX,Math.max(ay,by),1.5); line(midX,(ay+by)/2,px,py);
            }
        }
        for (let lvl=0; lvl<this.roundsPerSide-1; lvl++) {
            const nodes = this.rightRounds[lvl]||[], parents = this.rightRounds[lvl+1]||[];
            for (let i=0;i<nodes.length;i+=2) {
                const a=nodes[i], b=nodes[i+1], p=parents[i/2]; if (!a||!b||!p) continue;
                const ax = parseFloat(a.el.style.left),      ay = parseFloat(a.el.style.top)+this.H/2;
                const bx = parseFloat(b.el.style.left),      by = parseFloat(b.el.style.top)+this.H/2;
                const px = parseFloat(p.el.style.left)+this.W, py = parseFloat(p.el.style.top)+this.H/2;
                const midX = bx - this.GX/2;
                line(ax,ay,midX,ay); line(bx,by,midX,by); line(midX,Math.min(ay,by),midX,Math.max(ay,by),1.5); line(midX,(ay+by)/2,px,py);
            }
        }

        if (this.finalBubble && this.perSide >= 1) {
            const lRoot = this.leftRounds[this.roundsPerSide-1]?.[0];
            const rRoot = this.rightRounds[this.roundsPerSide-1]?.[0];
            if (lRoot && rRoot) {
                const centerX = parseFloat(this.finalBubble.style.left)+this.W/2;
                const leftY   = parseFloat(lRoot.el.style.top)+this.H/2;
                const rightY  = parseFloat(rRoot.el.style.top)+this.H/2;
                const finalBottom = parseFloat(this.finalBubble.style.top)+this.H;
                line(parseFloat(lRoot.el.style.left)+this.W,leftY,centerX,leftY,2);
                line(parseFloat(rRoot.el.style.left),rightY,centerX,rightY,2);
                line(centerX,Math.min(leftY,rightY),centerX,finalBottom,2);
            }
        }
    }

    private pow2Ceil(n:number){ let p=1; while(p<n) p<<=1; return p; }
}