import { ensureChartJS } from '../../utils/ensureChart';

export interface LineMatchesProps {
    labels: string[];
    values: number[];
}

/** Renders a line chart of matches count per day. */
export async function renderLineMatchesOverTime(container: HTMLElement, props: LineMatchesProps) {
    await ensureChartJS();
    const canvas = document.createElement('canvas');
    canvas.height = 220;
    container.replaceChildren(canvas);

    const Chart = (window as any).Chart;
    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: props.labels,
            datasets: [{ label: 'Matches', data: props.values }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}