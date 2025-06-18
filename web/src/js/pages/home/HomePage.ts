import PageBase from '../PageBase.js';

class HomePage extends PageBase {
    constructor() {
        super(
            '/js/pages/home/',
            '/',
            'index.html',
            ['style.css'],
            ['logic.js']
        );
    }
}

export default (): string => new HomePage().load();