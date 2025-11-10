import { setBubble } from '../Bubble';
import type { LeafAddress, Match, Player, RenderOptions } from '../../api/socket/types';
import type { SrvSnapshot } from '../../api/socket/messageTypes';
import { ClientStatus, MatchStatus } from '../../api/socket/protocol';
import i18n from "../../utils/lang/i18n";

/* ================= Helpers ================= */

/**
 * Group matches by round and sort each round by match index extracted from id.
 */
function groupByRound(snap: SrvSnapshot): Map<number, Match[]> {
    const by = new Map<number, Match[]>();
    const parseIndex = (id: string | number) => {
        const part = String(id).split('-r').pop()?.split('-')[1] ?? '0';
        return parseInt(part, 10);
    };

    const matches = (snap.matches || [])
        .slice()
        .sort((a, b) => parseIndex(a.id) - parseIndex(b.id));

    for (const m of matches) {
        const r = m.round ?? 1;
        if (!by.has(r)) {
            by.set(r, []);
        }
        by.get(r)!.push(m);
    }
    return by;
}

/**
 * Derive a bubble status from a label and the players map.
 */
function statusFor(label: string | null, players: Map<string, Player>): ClientStatus {
    if (!label) {
        return ClientStatus.EMPTY;
    }
    const p = players.get(label);
    if (!p) {
        return ClientStatus.EMPTY;
    }
    if (p.isReady) {
        return ClientStatus.READY;
    }
    if (p.connected) {
        return ClientStatus.CONNECTED;
    }
    return ClientStatus.OFFLINE;
}

/**
 * Format a label with optional score, or fallback dash.
 */
function fmtLabel(name: string | null | undefined, score?: number | null) {
    if (!name) {
        return '—';
    }
    return typeof score === 'number' ? `${name} (${score})` : name;
}

/**
 * Compute the CSS class for the "Ready" button.
 */
function readyClass(ready: boolean) {
    return ready
        ? 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/25 border border-sky-400/40'
        : 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30';
}

/* ================= Round 1 (leaf nodes) ================= */

/**
 * Decorate a round-1 leaf: set label/status and attach relevant actions.
 */
function decorateLeaf(
    el: HTMLElement,
    snap: SrvSnapshot,
    players: Map<string, Player>,
    opts: RenderOptions,
    match: Match,
    side: 'left' | 'right',
    pairIdx: number,
    posName: 'top' | 'bottom',
    slot: 'p1' | 'p2'
) {
    const finished = match.status === MatchStatus.FINISHED;

    let label: string | null = null;
    let score: number | undefined;
    let v: ClientStatus = ClientStatus.EMPTY;

    const pLabel: string | null = (match as any)[slot] ?? null;

    if (finished) {
        if (pLabel) {
            label = pLabel;
            if (label === match.winner) {
                v = ClientStatus.WINNER;
                score = match.winnerScore ?? undefined;
            } else if (label === match.loser) {
                v = ClientStatus.ELIMINATED;
                score = match.loserScore ?? undefined;
            } else {
                v = statusFor(label, players);
            }
        } else if (!match.p1 && !match.p2 && match.winner && match.loser) {
            if (slot === 'p1') {
                label = match.winner;
                score = match.winnerScore ?? undefined;
                v = ClientStatus.WINNER;
            } else {
                label = match.loser;
                score = match.loserScore ?? undefined;
                v = ClientStatus.ELIMINATED;
            }
        } else {
            label = pLabel;
            v = statusFor(label, players);
        }
    } else {
        label = pLabel;
        v = statusFor(label, players);
    }

    // Local ready override
    if (!finished && label && opts.myUsername && label === opts.myUsername) {
        const readyLocal = !!opts.isReady?.(opts.myUsername, { side, pair: pairIdx, pos: posName });
        if (readyLocal) {
            v = ClientStatus.READY;
        }
    }

    setBubble(el, fmtLabel(label, score), v);

    // Actions for round 1
    el.querySelectorAll('button[data-b]').forEach(b => b.remove());
    if (finished) {
        return;
    }

    const addr: LeafAddress = { side, pair: pairIdx, pos: posName };
    const isOwner = !!opts.isOwner || (!!snap.creator && opts.myUsername === snap.creator);

    if (!label && isOwner) {
        const b = button(
            i18n.t('pong_lobby_add_bot'),
            'px-2 py-1 text-[11px] rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 ml-2'
        );
        b.onclick = e => {
            e.stopPropagation();
            opts.onAddBot?.(match.id, slot);
        };
        b.dataset.b = 'add';
        mount(el, b);
    }

    // Ready (if mine)
    if (label && opts.myUsername === label) {
        const readyLocal = !!opts.isReady?.(opts.myUsername, addr);
        const b = button(readyLocal ? i18n.t('pong_lobby_you_ready') : i18n.t('pong_lobby_other_ready'), readyClass(readyLocal));
        b.onclick = e => {
            e.stopPropagation();
            opts.onReady?.(addr);
        };
        b.dataset.b = 'ready';
        mount(el, b);
    }

    // Remove (owner only; cannot remove the creator)
    if (label && isOwner) {
        const p = players.get(label);
        if (p && label !== snap.creator) {
            const b = button(
                p.isBot ? i18n.t('pong_lobby_remove_bot') : i18n.t('pong_lobby_remove_player'),
                'px-2 py-1 text-[11px] rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 ml-2'
            );
            b.onclick = e => {
                e.stopPropagation();
                opts.onRemove?.(label!);
            };
            b.dataset.b = 'remove';
            mount(el, b);
        }
    }
}

/**
 * Populate round-1 columns (left/right) with leaf nodes.
 */
function fillRound1(
    L: HTMLElement[][],
    R: HTMLElement[][],
    r1: Match[],
    players: Map<string, Player>,
    snap: SrvSnapshot,
    opts: RenderOptions
) {
    const perSide = L[0].length;
    const totalMatches = r1.length;

    if (perSide === 1) {
        const m = r1[0] || { id: 'ph', round: 1, p1: null, p2: null, status: MatchStatus.WAITING };
        decorateLeaf(L[0][0], snap, players, opts, m, 'left', 0, 'top', 'p1');
        decorateLeaf(R[0][0], snap, players, opts, m, 'right', 0, 'top', 'p2');
        return;
    }

    const half = Math.max(1, totalMatches >> 1);
    const leftMatches = r1.slice(0, half);
    const rightMatches = r1.slice(half, half * 2);

    for (let i = 0; i < leftMatches.length; i++) {
        const m = leftMatches[i];
        const li = i * 2;
        decorateLeaf(L[0][li],     snap, players, opts, m, 'left',  i, 'top',    'p1');
        decorateLeaf(L[0][li + 1], snap, players, opts, m, 'left',  i, 'bottom', 'p2');
    }
    for (let i = 0; i < rightMatches.length; i++) {
        const m = rightMatches[i];
        const ri = i * 2;
        decorateLeaf(R[0][ri],     snap, players, opts, m, 'right', i, 'top',    'p1');
        decorateLeaf(R[0][ri + 1], snap, players, opts, m, 'right', i, 'bottom', 'p2');
    }
}

/* ================= Rounds >= 2 ================= */

/**
 * Decorate a non-leaf node (rounds >= 2) with label/status/score.
 */
function decorateUpperNode(
    el: HTMLElement,
    label: string | null,
    finished: boolean,
    winnerName: string | null | undefined,
    myUsername: string | undefined,
    readyLocal: boolean,
    players: Map<string, Player>,
    score?: number | null
) {
    if (!label) {
        return;
    }
    if (finished) {
        const isWinner = !!winnerName && label === winnerName;
        setBubble(
            el,
            fmtLabel(label, typeof score === 'number' ? score : undefined),
            isWinner ? ClientStatus.WINNER : ClientStatus.ELIMINATED
        );
        return;
    }
    let v = statusFor(label, players);
    if (label === myUsername && readyLocal) {
        v = ClientStatus.READY;
    }
    setBubble(el, fmtLabel(label), v);
}

/**
 * Add a "Ready" button to a node if it belongs to the current user.
 */
function addReadyIfMine(el: HTMLElement, label: string | null, opts: RenderOptions, addr: LeafAddress) {
    el.querySelectorAll('button[data-b]').forEach(b => b.remove());
    if (!label || !opts.myUsername || label !== opts.myUsername) {
        return;
    }
    const readyLocal = !!opts.isReady?.(opts.myUsername, addr);
    const b = button(readyLocal ? i18n.t('pong_lobby_you_ready') : i18n.t('pong_lobby_other_ready'), readyClass(readyLocal));
    b.onclick = e => {
        e.stopPropagation(); opts.onReady?.(addr); 
    };
    b.dataset.b = 'ready';
    mount(el, b);
}

/**
 * Populate rounds >= 2 (handles 1v1, 4 players, and 8 players layouts).
 */
function fillUpperRounds(
    L: HTMLElement[][],
    R: HTMLElement[][],
    grouped: Map<number, Match[]>,
    max: number,
    players: Map<string, Player>,
    finalBox: HTMLElement,
    opts: RenderOptions
) {
    const totalRounds = Math.log2(max) | 0;

    // 1v1: everything is in R1
    if (totalRounds === 1) {
        const r1 = grouped.get(1) || [];
        const fm = r1[0];
        if (fm?.winner) {
            setBubble(finalBox, fmtLabel(fm.winner, fm.winnerScore), ClientStatus.WINNER);
        }
        return;
    }

    // 4 players: round 2 is the final
    if (totalRounds === 2) {
        const r2 = grouped.get(2) || [];
        const fm = r2[0];
        if (fm) {
            if (L[1]?.[0] && fm.p1) {
                const finished = fm.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'left', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (fm.winner === fm.p1 ? fm.winnerScore : fm.loser === fm.p1 ? fm.loserScore : undefined)
                    : undefined;
                decorateUpperNode(L[1][0], fm.p1, finished, fm.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(L[1][0], fm.p1, opts, { side: 'left', pair: 0, pos: 'top' });
                }
            }
            if (R[1]?.[0] && fm.p2) {
                const finished = fm.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'right', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (fm.winner === fm.p2 ? fm.winnerScore : fm.loser === fm.p2 ? fm.loserScore : undefined)
                    : undefined;
                decorateUpperNode(R[1][0], fm.p2, finished, fm.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(R[1][0], fm.p2, opts, { side: 'right', pair: 0, pos: 'top' });
                }
            }
            if (fm.winner) {
                setBubble(finalBox, fmtLabel(fm.winner, fm.winnerScore), ClientStatus.WINNER);
            }
        }
        return;
    }

    // 8 players: round 2 has two nodes per side; round 3 is the final
    if (totalRounds === 3) {
        const r2 = grouped.get(2) || [];
        const r3 = grouped.get(3) || []; // final
        const semiLeft  = r2[0];
        const semiRight = r2[1];
        const finalMatch = r3[0];

        // r2-1 -> L[1][0]=p1, L[1][1]=p2
        if (semiLeft) {
            if (L[1]?.[0] && semiLeft.p1) {
                const finished = semiLeft.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'left', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (semiLeft.winner === semiLeft.p1 ? semiLeft.winnerScore
                        : semiLeft.loser === semiLeft.p1 ? semiLeft.loserScore : undefined)
                    : undefined;
                decorateUpperNode(L[1][0], semiLeft.p1, finished, semiLeft.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(L[1][0], semiLeft.p1, opts, { side: 'left', pair: 0, pos: 'top' });
                }
            }
            if (L[1]?.[1] && semiLeft.p2) {
                const finished = semiLeft.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'left', pair: 1, pos: 'top' } as any);
                const score = finished
                    ? (semiLeft.winner === semiLeft.p2 ? semiLeft.winnerScore
                        : semiLeft.loser === semiLeft.p2 ? semiLeft.loserScore : undefined)
                    : undefined;
                decorateUpperNode(L[1][1], semiLeft.p2, finished, semiLeft.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(L[1][1], semiLeft.p2, opts, { side: 'left', pair: 1, pos: 'top' });
                }
            }
        }

        // r2-2 -> R[1][0]=p1, R[1][1]=p2
        if (semiRight) {
            if (R[1]?.[0] && semiRight.p1) {
                const finished = semiRight.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'right', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (semiRight.winner === semiRight.p1 ? semiRight.winnerScore
                        : semiRight.loser === semiRight.p1 ? semiRight.loserScore : undefined)
                    : undefined;
                decorateUpperNode(R[1][0], semiRight.p1, finished, semiRight.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(R[1][0], semiRight.p1, opts, { side: 'right', pair: 0, pos: 'top' });
                }
            }
            if (R[1]?.[1] && semiRight.p2) {
                const finished = semiRight.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'right', pair: 1, pos: 'top' } as any);
                const score = finished
                    ? (semiRight.winner === semiRight.p2 ? semiRight.winnerScore
                        : semiRight.loser === semiRight.p2 ? semiRight.loserScore : undefined)
                    : undefined;
                decorateUpperNode(R[1][1], semiRight.p2, finished, semiRight.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(R[1][1], semiRight.p2, opts, { side: 'right', pair: 1, pos: 'top' });
                }
            }
        }

        // round 3 (final) -> L[2][0] and R[2][0]
        if (finalMatch) {
            // left side = final.p1
            if (L[2]?.[0] && finalMatch.p1) {
                const finished = finalMatch.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'left', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (finalMatch.winner === finalMatch.p1 ? finalMatch.winnerScore
                        : finalMatch.loser === finalMatch.p1 ? finalMatch.loserScore : undefined)
                    : undefined;
                decorateUpperNode(L[2][0], finalMatch.p1, finished, finalMatch.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(L[2][0], finalMatch.p1, opts, { side: 'left', pair: 0, pos: 'top' });
                }
            }
            // right side = final.p2
            if (R[2]?.[0] && finalMatch.p2) {
                const finished = finalMatch.status === MatchStatus.FINISHED;
                const readyLocal = !!opts.isReady?.(opts.myUsername!, { side: 'right', pair: 0, pos: 'top' } as any);
                const score = finished
                    ? (finalMatch.winner === finalMatch.p2 ? finalMatch.winnerScore
                        : finalMatch.loser === finalMatch.p2 ? finalMatch.loserScore : undefined)
                    : undefined;
                decorateUpperNode(R[2][0], finalMatch.p2, finished, finalMatch.winner, opts.myUsername, readyLocal, players, score);
                if (!finished) {
                    addReadyIfMine(R[2][0], finalMatch.p2, opts, { side: 'right', pair: 0, pos: 'top' });
                }
            }

            // winner box
            if (finalMatch.winner) {
                setBubble(finalBox, fmtLabel(finalMatch.winner, finalMatch.winnerScore), ClientStatus.WINNER);
            }
        }

        return;
    }
}

/* ================= Public entry ================= */

/**
 * Top-level decorator: fills round 1 and upper rounds based on snapshot and max.
 */
export function decorateFromMatches(
    L: HTMLElement[][],
    R: HTMLElement[][],
    finalBox: HTMLElement,
    snap: SrvSnapshot,
    players: Map<string, Player>,
    opts: RenderOptions,
    max: number
) {
    const grouped = groupByRound(snap);
    const r1 = grouped.get(1) || [];
    fillRound1(L, R, r1, players, snap, opts);
    fillUpperRounds(L, R, grouped, max, players, finalBox, opts);
}

/* ================= UI helpers ================= */

/**
 * Create a styled button element.
 */
function button(label: string, cls: string) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.className = cls + ' focus:outline-none transition';
    return b;
}

/**
 * Mount a button inside a bubble and ensure layout props.
 */
function mount(el: HTMLElement, btn: HTMLButtonElement) {
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.gap = '8px';
    btn.setAttribute('data-b', '1');
    el.appendChild(btn);
}