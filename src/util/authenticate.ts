import { KEY } from './secrets.js';

function authenticate(attemptKey: string) {
    return attemptKey === KEY;
}

export default authenticate;