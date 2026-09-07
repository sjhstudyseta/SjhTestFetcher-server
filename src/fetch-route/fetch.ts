// actual server logic
import type { Request, Response } from 'express';
import state from './state.js';
import fetchFileData from './byQuery.js';
import * as fetcherImpl from '../fetcher/fetcher-impl.js';
import authenticate from '../util/authenticate.js';
import { USER_ID, PASSWORD } from '../util/secrets.js';

async function fetch(req: Request, res: Response) {
    const reqData = parseReq(req);
    const isAuthenticated = authenticate(reqData.attemptKey)

    console.log(`${req.originalUrl} Attempted: ${reqData.attemptKey}`);

    if (state.running() && !isAuthenticated) {
        res.status(429).send("Someone's using me! Try a bit later. (Or try again if on browser)");
        return;
    }

    state.update(isAuthenticated, true);

    try {
        state.cookie = state.cookie ?? await fetcherImpl.setup(USER_ID, PASSWORD);
        const fileData = await fetchFileData(state.cookie, reqData.after, reqData.count);
    }
    catch (err) {
        state.cookie = null;
        console.error(err);
        res.status(500).send("I'm sorry. Something went wrong. Please contact us.");
    }
    finally {
        if (state.running(isAuthenticated)) {
            state.cookie = null;
        }

        state.update(isAuthenticated, false);
    }
}

export default fetch;

function parseReq(req: Request) {
    return {
        attemptKey: req.headers['key'] as string,
        after: req.query.after?.toString(),
        count: validate(parseInt(req.query.count as string))
    }
}

function validate(num: number) {
  return isNaN(num) || num < 0 ? undefined : num;
}