import { config } from 'dotenv';
import express from 'express';
import * as fetcherImpl from './fetcher-impl.js';

// config .env
config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

let isRunning = false;

app.get('/fetch', async(req, res) => {
  const attemptKey = req.headers['key'];
  const countParam = req.query.count ? parseInt(req.query.count) : null;
  const afterParam = req.query.after;

  console.log(`${req.url} recieved`);

  if (!authenticate(attemptKey)) {
    console.warn(`Bad attempt. They tried: ${attemptKey}`)
    res.status(401).send("Invalid key. Don't you dare try to mess with me!");
    return;
  }

  if (isRunning) {
    res.status(429).send("Someone's using me! Try a bit later.");
    return;
  }

  isRunning = true;

  try {
    const cookieStr = await fetcherImpl.setup(process.env.USER_ID, process.env.PASSWORD);
    const fileData = await fetchData(cookieStr, countParam, afterParam);
    res.json(fetcherImpl.exportJSON(fileData));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("I'm sorry. Something went wrong. Please contact us.")
  }
  finally {
    isRunning = false;
  }
});

app.get('/', (req, res) => {
  res.send('Fetcher active! Try GET /fetch');
});
 
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function fetchData(cookieStr, countParam, afterParam) {
  let fileData = null;

  if (validNum(countParam) && !afterParam) { // not null, null
    fileData = await fetcherImpl.fetchFileData(cookieStr, countParam);
  } 
  else if (!validNum(countParam) && afterParam) { // null, not null
    if (!await fetcherImpl.needsUpdate(cookieStr, afterParam)) return 'Up to date.';

    fileData = await fetcherImpl.fetchFileDataAfter(cookieStr, afterParam);
  } 
  else if (validNum(countParam) && afterParam) {  // not null, not null
    if (!await fetcherImpl.needsUpdate(cookieStr, afterParam)) return 'Up to date.';

    fileData = await fetcherImpl.fetchFileDataAfter(cookieStr, afterParam, countParam);
  }
  else { // null, null
    let count = await fetcherImpl.getBoardListCount(cookieStr);
    fileData = count ? await fetcherImpl.fetchFileData(cookieStr, count) : null;
  }

  if (!fileData) {
    throw new Error(`fileData is null. ${countParam}, ${afterParam}`);
  }

  return fileData;
}

function validNum(any) {
  return any !== null && !isNaN(any) && any >= 0; 
}

function authenticate(key) {
  return key === process.env.KEY;
}