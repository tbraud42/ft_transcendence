import { ensureChartJS } from '../../utils/ensureChart';

export interface BarScoresProps {
    labels: string[];
    you: number[];
    opp: number[];
}

/** Renders a bar chart comparing your scores vs opponent scores on last games. */
export async function renderBarScores(container: HTMLElement, props: BarScoresProps) {
    await ensureChartJS();
    const canvas = document.createElement('canvas');
    canvas.height = 220;
    container.replaceChildren(canvas);

    const Chart = (window as any).Chart;
    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: props.labels,
            datasets: [
                { label: 'You', data: props.you },
                { label: 'Opponent', data: props.opp }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}