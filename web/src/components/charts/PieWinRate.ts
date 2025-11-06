import { ensureChartJS } from '../../utils/ensureChart';

export interface PieWinRateProps {
    wins: number;
    losses: number;
}

/** Renders a pie chart for win rate into a provided container. */
export async function renderPieWinRate(container: HTMLElement, props: PieWinRateProps) {
    await ensureChartJS();
    const canvas = document.createElement('canvas');
    canvas.height = 220;
    container.replaceChildren(canvas);

    const Chart = (window as any).Chart;
    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{ data: [props.wins, props.losses] }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}