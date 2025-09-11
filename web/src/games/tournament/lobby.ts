import Bracket from './Bracket';

export type LobbyCleanup = () => void;

export function renderLobby(
    container: HTMLElement,
    opts: {
        statusText?: string;
        onLeave: () => void;
        bracket?: Bracket;
    }
): LobbyCleanup {
    container.innerHTML = `
    <section class="space-y-4 text-slate-100">
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div class="text-lg font-semibold">Lobby</div>
        <p id="lobby-status" class="text-sm text-slate-300">${opts.statusText ?? 'En attente…'}</p>
        <button id="lobby-leave" class="mt-3 px-3 py-2 rounded-md text-sm bg-rose-600 hover:bg-rose-500">
          Quitter le tournoi
        </button>
      </div>
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div id="bracket-mount"></div>
      </div>
    </section>
  `;

    const btn = container.querySelector('#lobby-leave') as HTMLButtonElement;
    btn.onclick = (e) => { e.preventDefault(); opts.onLeave(); };

    if (opts.bracket) {
        const mount = container.querySelector('#bracket-mount') as HTMLDivElement;
        opts.bracket.attachTo(mount);
    }

    return () => {
        container.innerHTML = '';
    };
}