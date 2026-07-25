import puppeteer, { Keyboard } from 'puppeteer';
import { config } from 'dotenv';

// config .env
config({ quiet: true });
const userId = process.env.USER_ID;
const password = process.env.PASSWORD;

// config puppeteer
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

const mainPageURL = 'https://seoulsejong.sen.hs.kr';
const loginURL = 'https://seoulsejong.sen.hs.kr/dggb/cmm/actionLogin.do';   // you can't go directly using this url. must use memberLoginForm() in mainpage.
const testBankURL = 'https://seoulsejong.sen.hs.kr/41012/subMenu.do';

async function setup() {
    await goto(mainPageURL);

    if (!await login(userId, password)) {
        throw new Error('Failed to login! Recheck credentials please!');
    }

    await goto(testBankURL);

    await injectFetcher();
}

async function goto(url) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: '30000' });
}

async function login(userId, password) {
    // navigate to login page and wait to load
    await page.evaluate(() => memberLoginForm());    
    await page.waitForSelector('.member_login_box');

    // enter login info and confirm
    await page.locator('#userId').fill(userId);
    await page.locator('#password').fill(password);
    await page.locator('.member_join').click();

    await page.waitForNavigation();

    return page.url != loginURL; // url when failed login
}

// injected script won't work if reloaded/site changes
async function injectFetcher() {
    await page.addScriptTag({ path: './fetcher.js' });
}

async function getBoardListCount() {
    return await page.evaluate(() => getBoardListCount());
}

// use after injectFetcher()
async function needsUpdate(latestNttId) {
    return await page.evaluate(latestNttId => needsUpdate(latestNttId), latestNttId);
}

async function fetchFileData(count) {
    return await page.evaluate(count => {
        let boardListBody = getBoardListBody(count);
        if (!boardListBody) return null;

        let idList = parseToIdList(boardListBody);
        if (!idList) return null;

        return getFileDataFromIdList(idList);
    }, count);
}

async function fetchFileDataAfter(nttId) {
    return await page.evaluate(nttId => {
        let wholeCount = getBoardListCount();
        if (!wholeCount) return null;

        let boardListBody = getBoardListBody(wholeCount);
        if (!boardListBody) return null;

        let idList = parseToIdList(boardListBody);
        if (!idList) return null;

        let idIndex = idList.findIndex(e => e.nttId === nttId);
        idIndex = idIndex === -1 ? wholeCount : idIndex;

        idList.splice(idIndex);

        return getFileDataFromIdList(idList);
    }, nttId);
}

function exportJSON(fileData) {
    let withMetaData = { 
        date: new Date().toISOString(),
        latestNttId: fileData.length > 0 ? fileData[0].nttId : '',
        data: fileData
    }
  
    return JSON.stringify(withMetaData, null, 2);
}

await setup();
await browser.close();