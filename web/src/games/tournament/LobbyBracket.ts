export type MatchScore = { s1: number; s2: number };

type MatchNode = {
    id: string;
    round: number;
    index: number;
    p1?: string | null;
    p2?: string | null;
    winner?: string | null;
    score?: MatchScore | null;
    isPlaceholder?: boolean;
};

export default class LobbyBracket {
    private root: HTMLElement;
    private rounds: MatchNode[][] = [];
    private byId = new Map<string, MatchNode>();
    private players = new Set<string>();

    constructor(root: HTMLElement) {
        this.root = root;
        this.root.classList.add('relative');
        this.render();
    }

    setPlayers(list: string[]) {
        for (const p of list) this.players.add(p);
        this.render();
    }

    addPlayer(username: string) {
        this.players.add(username);
        this.render();
    }

    pair(matchId: string, p1: string, p2: string) {
        if (!matchId) return;
        const ex = this.byId.get(matchId);
        if (ex) {
            ex.p1 = p1; ex.p2 = p2; ex.isPlaceholder = false;
            this.render();
            return;
        }
        const ph = this.findNodeByPlayers(p1, p2);
        if (ph) {
            this.byId.delete(ph.id);
            ph.id = matchId;
            ph.p1 = p1; ph.p2 = p2; ph.isPlaceholder = false;
            this.byId.set(matchId, ph);
            this.render();
            return;
        }
        const node = this.createNode(0, this.nextIndexForRound(0), matchId);
        node.p1 = p1; node.p2 = p2; node.isPlaceholder = false;
        this.render();
    }

    setWinner(matchId: string, winner: string, score?: MatchScore | null) {
        const node = this.byId.get(matchId);
        if (!node) return;
        node.winner = winner;
        node.score = score ?? null;

        const nextRound = node.round + 1;
        const nextIndex = Math.floor(node.index / 2);
        const target = this.ensureNode(nextRound, nextIndex);
        const isLeft = node.index % 2 === 0;
        if (isLeft) target.p1 = winner; else target.p2 = winner;

        this.render();
    }

    private nextIndexForRound(r: number) {
        const col = this.rounds[r];
        return col ? col.length : 0;
    }

    private createNode(round: number, index: number, id?: string) {
        if (!this.rounds[round]) this.rounds[round] = [];
        const node: MatchNode = {
            id: id || `R${round}-I${index}`,
            round, index,
            p1: null, p2: null,
            winner: null, score: null,
            isPlaceholder: !id,
        };
        this.rounds[round][index] = node;
        this.byId.set(node.id, node);
        return node;
    }

    private ensureNode(round: number, index: number) {
        const col = this.rounds[round];
        if (col && col[index]) return col[index];
        return this.createNode(round, index);
    }

    private findNodeByPlayers(a: string, b: string) {
        for (const col of this.rounds) {
            for (const n of col || []) {
                if (!n) continue;
                const set = new Set([n.p1, n.p2].filter(Boolean) as string[]);
                if (set.size === 2 && set.has(a) && set.has(b)) return n;
            }
        }
        return undefined;
    }

    private render() {
        this.root.innerHTML = `
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div class="grid gap-6" style="grid-auto-flow: column;">
          <div id="rounds"></div>
        </div>
      </div>
    `;
        const roundsWrap = this.root.querySelector('#rounds') as HTMLDivElement;

        if (!this.rounds[0] || this.rounds[0].length === 0) {
            const initial = [...this.players];
            for (let i = 0; i < initial.length; i += 2) {
                const n = this.createNode(0, this.nextIndexForRound(0));
                n.p1 = initial[i] || null;
                n.p2 = initial[i + 1] || null;
            }
        }

        for (let r = 0; r < this.rounds.length; r++) {
            const col = this.rounds[r] || [];
            if (col.length === 0) continue;

            const colEl = document.createElement('div');
            colEl.className = 'min-w-[260px]';

            const title = document.createElement('div');
            title.className = 'text-xs text-slate-400 mb-2';
            title.textContent = r === this.rounds.length - 1 ? 'Finale' : `Round ${r + 1}`;
            colEl.appendChild(title);

            col.forEach((m) => {
                if (!m) return;
                colEl.appendChild(this.renderMatch(m));
            });

            roundsWrap.appendChild(colEl);
        }

        this.drawConnectors();
    }

    private renderMatch(m: MatchNode) {
        const card = document.createElement('div');
        card.className = 'relative p-3 rounded-xl border text-sm mb-4 ' +
            (m.winner ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200'
                : 'border-slate-800 bg-slate-950/40 text-slate-200');

        const head = document.createElement('div');
        head.className = 'flex justify-between items-center mb-2';
        head.innerHTML = `
      <span class="text-xs text-slate-400">${m.isPlaceholder ? '(à venir)' : m.id}</span>
      <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
        ${m.winner ? 'Terminé' : 'À jouer'}
      </span>
    `;
        card.appendChild(head);

        const row = (name: string | null, win: boolean) => {
            const div = document.createElement('div');
            div.className = 'px-2 py-1 rounded border ' + (win
                ? 'bg-emerald-900/30 border-emerald-700'
                : 'bg-slate-900/40 border-slate-800');
            div.textContent = name || '—';
            return div;
        };

        card.appendChild(row(m.p1 ?? null, !!m.winner && m.winner === m.p1));
        card.appendChild(row(m.p2 ?? null, !!m.winner && m.winner === m.p2));

        if (m.winner && m.score) {
            const sc = document.createElement('div');
            sc.className = 'text-xs text-slate-400 mt-1';
            sc.textContent = `Score : ${m.score.s1} – ${m.score.s2}`;
            card.appendChild(sc);
        }

        card.dataset.anchorTop = '1';
        return card;
    }

    private drawConnectors() {
    }
}