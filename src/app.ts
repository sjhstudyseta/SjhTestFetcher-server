import type { Request } from 'express';
import express from 'express';

const app = express();

app.get('/fetch', );


function parseParams(req: Request) {
    return {
        attemptKey: req.headers['key'],
        count: req.query.count,
        after: req.query.after
    }
}

export default app;