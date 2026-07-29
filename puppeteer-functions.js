export const mainPageURL = 'https://seoulsejong.sen.hs.kr';
export const loginURL = 'https://seoulsejong.sen.hs.kr/dggb/cmm/actionLogin.do';   // you can't go directly using this url. must use memberLoginForm() in mainpage.
export const testBankURL = 'https://seoulsejong.sen.hs.kr/41012/subMenu.do';

export async function goto(page, url) {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: '30000' });
}

export async function login(page, userId, password) {
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
export async function injectFetcher(page) {
    if (await page.$('#fetcher-injection') !== null) return;

    await page.addScriptTag({ path: './fetcher-injection.js', id: 'fetcher-injection' });
}

export async function getBoardListCount(page) {
    await injectFetcher(page);

    return await page.evaluate(async() => await getBoardListCount());
}

export async function needsUpdate(page, latestNttId) {
    await injectFetcher(page);

    return await page.evaluate(async latestNttId => await needsUpdate(latestNttId), latestNttId);
}

export async function fetchFileData(page, count) {
    if (count < 0) return null;
    
    await injectFetcher(page);

    return await page.evaluate(async count => {
        let boardListBody = await getBoardListBody(count);
        if (!boardListBody) return null;

        let idList = parseToIdList(boardListBody);
        if (!idList) return null;

        idList.splice(count);   // if count < 10 then idList length = 10

        return await getFileDataFromIdList(idList);
    }, count);
}

export async function fetchFileDataAfter(page, nttId) {
    await injectFetcher(page);

    return await page.evaluate(async nttId => {
        let wholeCount = await getBoardListCount();
        if (!wholeCount) return null;

        let boardListBody = await getBoardListBody(wholeCount);
        if (!boardListBody) return null;

        let idList = parseToIdList(boardListBody);
        if (!idList) return null;

        let idIndex = idList.findIndex(e => e.nttId === nttId);
        idIndex = idIndex === -1 ? wholeCount : idIndex;

        idList.splice(idIndex);

        return await getFileDataFromIdList(idList);
    }, nttId);
}

export function exportJSON(fileData) {
    let withMetaData = { 
        date: new Date().toISOString(),
        latestNttId: fileData.length > 0 ? fileData[0].nttId : '',
        data: fileData
    }
  
    return JSON.stringify(withMetaData, null, 2);
}