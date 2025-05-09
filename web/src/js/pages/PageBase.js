export default class PageBase {
    constructor(path, route, htmlFile, cssFiles, jsFiles) {
        this.path = path;
        this.route = route;
        this.htmlFile = htmlFile;
        this.cssFiles = cssFiles;
        this.jsFiles = jsFiles;
    }

    load() {
        this._injectCSS();
        this._injectJS();
        return this._loadHTML();
    }

    _injectCSS() {
        this.cssFiles.forEach(file => {
            if (!document.querySelector(`link[data-page-css="${this.route}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `${this.path}${file}`;
                link.setAttribute('data-page-css', this.route);
                document.head.appendChild(link);
            }
        });
    }

    _injectJS() {
        this.jsFiles.forEach(file => {
            if (!document.querySelector(`script[data-page-js="${this.route}"]`)) {
                const script = document.createElement('script');
                script.type = 'module';
                script.src = `${this.path}${file}`;
                script.setAttribute('data-page-js', this.route);
                document.body.appendChild(script);
            }
        });
    }

    _loadHTML() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${this.path}${this.htmlFile}`, false);
        xhr.send(null);
        if (xhr.status === 200) {
            return xhr.responseText;
        } else {
            return `<h1>Erreur lors du chargement de la vue depuis ${this.path}</h1>`;
        }
    }
}