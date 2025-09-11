export type BubbleVariant = 'default' | 'winner' | 'eliminated' | 'playing';

export interface BubbleOptions {
    label?: string;
    variant?: BubbleVariant;
    width?: number;
    height?: number;
    radius?: number;
}

const VARIANT_CLASS: Record<BubbleVariant, string> = {
    default:   'border-slate-200/80 text-slate-100 bg-transparent',
    winner:    'border-emerald-400/90 text-emerald-200 bg-emerald-900/20',
    eliminated:'border-rose-400/90 text-rose-200 bg-rose-900/20 line-through',
    playing:   'border-sky-400/90 text-sky-200 bg-sky-900/20',
};

export function createBubble(opts: BubbleOptions = {}): HTMLDivElement {
    const {
        label   = '—',
        variant = 'default',
        width   = 200,
        height  = 56,
        radius  = 12,
    } = opts;

    const el = document.createElement('div');
    el.className = [
        'bubble',
        'absolute',
        'flex items-center',
        'px-4',
        'font-semibold',
        'border-2',
        'whitespace-nowrap overflow-hidden text-ellipsis',
        VARIANT_CLASS[variant],
    ].join(' ');

    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.borderRadius = `${radius}px`;
    el.textContent = label;

    (el as any).__bubble = { variant, width, height, radius };
    return el;
}

export function setBubbleLabel(el: HTMLElement, label: string) {
    el.textContent = label;
}

export function setBubbleVariant(el: HTMLElement, variant: BubbleVariant) {
    const b = (el as any).__bubble as BubbleOptions & { variant: BubbleVariant };
    if (!b) return;
    el.classList.remove(...Object.values(VARIANT_CLASS).flatMap(c => c.split(' ')));
    el.classList.add(...VARIANT_CLASS[variant].split(' '));
    b.variant = variant;
}