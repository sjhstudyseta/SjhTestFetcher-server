// app entry point, server -> fetch -> byQuery
import express from 'express';
import fetch from './fetch-route/fetch.js';
import { PORT } from './util/secrets.js';

const app = express();

app.get('/fetch', fetch);

app.get('/', (req, res) => {
  res.send('Fetcher active! Try GET /fetch\n');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});