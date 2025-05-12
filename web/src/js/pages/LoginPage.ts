import PageBase from './PageBase.js';

class LoginPage extends PageBase {
    constructor() {
        super(
            '/pages/login/',
            '/',
            'index.html',
            ['style.css'],
            ['logic.js']
        );
    }
}

export default (): string => new LoginPage().load();