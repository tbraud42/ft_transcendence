import LoginPage from './pages/login/LoginPage.js';
import HomePage from './pages/home/HomePage.js';
import { AddLangButton } from "./components/LangButton.js";
import { AddFooter } from "./components/footer/Footer.js";

type Route = {
    [key: string]: () => string;
};

const routes: Route = {
    '/': LoginPage,
    '/home': HomePage,
};

/**
 * @brief Router function to handle navigation
 * and load the appropriate page content
 * based on the current URL path.
 */
function router(): void {
    const path = window.location.pathname;
    const contentDiv = document.getElementById('app');
    if (!contentDiv) {
        return;
    }
    contentDiv.style.visibility = 'hidden';
    const page = routes[path];
    if (page) {
        contentDiv.innerHTML = page();
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
    contentDiv.style.visibility = 'visible';
}

document.addEventListener('DOMContentLoaded', async () => {
    router();

    //TODO: Load in a different place?
    AddLangButton(document.getElementById('app'));

});

window.addEventListener('popstate', router);