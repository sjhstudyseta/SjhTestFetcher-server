import { config } from 'dotenv';
import express from 'express';
import puppeteer from 'puppeteer';
import * as fetcher from './puppeteer-functions.js';

// config .env
config({ quiet: true });
const userId = process.env.USER_ID;
const password = process.env.PASSWORD;

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/fetch', async (req, res) => {
    const attemptKey = req.headers['key'];
    if (!authenticate(attemptKey)) {
        console.warn(`Invalid key. They tried: '${attemptKey}'`);
        res.status(401).send(`Invalid key.`);
        return;
    }
    
    let browser;
    let page;
    try {
        browser = await puppeteer.launch({ headless: true, protocolTimeout: 300000, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        page = await browser.newPage();

        let countParam = req.query.count ? parseInt(req.query.count) : null;
        let afterParam = req.query.after;

        await setup(page);

        res.json(await fetchData(page, countParam, afterParam));
    } 
    catch(err) {
        console.error(err);
        res.status(500).send('Something went wrong... Contact owner please!');
    } 
    finally {
        try {
            if (page) await page.close();
            if (browser) await browser.close();
        } catch (err) {
            console.error(err);
        }
    }
});

app.get('/', (req, res) => {
  res.send('Fetcher active! Try GET /fetch');
});
 
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function authenticate(key) {
    return key === process.env.KEY;
}

async function setup(page) {
    await fetcher.goto(page, fetcher.mainPageURL);

    if (!await fetcher.login(page, userId, password)) {
        throw new Error(`Bad credentials!`);
    }

    await fetcher.goto(page, fetcher.testBankURL);
}

async function fetchData(page, countParam, afterParam) {
    let fileData = null;
    
    if (validNum(countParam) && !afterParam) {    // not null, null
        fileData = await fetcher.fetchFileData(page, countParam);
    } 
    else if (afterParam) {   // null, not null
        if (!await fetcher.needsUpdate(page, afterParam)) return 'Up to date.';
        
        fileData = await fetcher.fetchFileDataAfter(page, afterParam);

        if (validNum(countParam) && fileData) fileData.splice(countParam);  // not null, not null
    } 
    else {    // null, null
        let count = await fetcher.getBoardListCount(page);
        if (count) {
            fileData = await fetcher.fetchFileData(page, count);
        }
    }

    if (!fileData) {
        throw new Error(`fileData is null. ${countParam}, ${afterParam}`);
    }

    return fetcher.exportJSON(fileData);
}

function validNum(any) {
    return any !== null && !isNaN(any) && any >= 0; 
}