import { KEY } from './secrets.js';

function authenticate(attemptKey: string | undefined) {
    return attemptKey === KEY;
}

export default authenticate;