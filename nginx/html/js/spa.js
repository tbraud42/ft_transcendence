import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';

const routes = {
    '/': LoginPage,
    '/home': HomePage,
};

function router() {
    const path = window.location.pathname;
    const contentDiv = document.getElementById('content');
    if (!contentDiv) {
        return;
    }

    const view = routes[path];
    //load html
    if (view) {
        contentDiv.innerHTML = view();
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
    // Remove all styles from old pages
    const styles = document.querySelectorAll('link[rel="stylesheet"][data-page-css]');
    styles.forEach(style => {
        if (style.getAttribute('data-page-css') !== path) {
            style.remove();
        }
    });
    //load js
    const scripts = document.querySelectorAll('script[data-page-js]');
    scripts.forEach(script => {
        if (script.getAttribute('data-page-js') === path) {
            script.remove();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    app.appendChild(contentDiv);

    router();
});

window.addEventListener('popstate', router);