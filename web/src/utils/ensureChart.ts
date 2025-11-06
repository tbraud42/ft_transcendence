export function ensureChartJS(): Promise<void> {
    if ((window as any).Chart) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Chart.js load failed'));
        document.head.appendChild(s);
    });
}