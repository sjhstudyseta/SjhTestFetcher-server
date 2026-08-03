import * as fetcher from './fetcher-base.js';

export async function setup(userId, password) {
    const cookieStr = await fetcher.getCookieStr();

    if (!await fetcher.login(cookieStr, userId, password)) {
        throw new Error('Login failed! Bad credentials.');
    }
    
    if (!await fetcher.loadSubMenu(cookieStr)) {
        throw new Error('Login session expired. (res set-cookie was not null)');
    }

    return cookieStr;
}

export async function getBoardListCount(cookieStr) {
    return await fetcher.getBoardListCount(cookieStr);
}

export async function needsUpdate(cookieStr, latestNttId) {
    return await fetcher.needsUpdate(cookieStr, latestNttId);
}

export async function fetchFileData(cookieStr, count = 10) {
    if (count < 0) throw new Error(`Negative count isn't a thing silly! (${count})`);

    const $boardList = await fetcher.getBoardList(cookieStr, count);
    if (!$boardList) throw new Error('Login session expired. (res set-cookie was not null)');

    const idList = fetcher.parseToIdList($boardList);

    idList.splice(count);

    return await fetcher.getFileDataFromIdList(cookieStr, idList);
}

export async function fetchFileDataAfter(cookieStr, latestNttId, count = null) {
    count = !count ? await fetcher.getBoardListCount(cookieStr) : count; 
    if (!count) throw new Error('Failed to get boardListCount! Session expired or total unparsable.');

    const $boardList = await fetcher.getBoardList(cookieStr, count);
    if (!$boardList) throw new Error('Login session expired. (res set-cookie was not null)');

    const idList = fetcher.parseToIdList($boardList);

    let idIndex = idList.findIndex(e => e === latestNttId);
    idIndex = idIndex === -1 ? count : idIndex;

    idList.splice(idIndex);

    return await fetcher.getFileDataFromIdList(cookieStr, idList);
}

export function exportJSON(fileData) {
    let withMetaData = {
        date: new Date().toISOString(),
        latestNttId: fileData.length > 0 ? fileData[0].nttId : '',
        data: fileData
    }

    return JSON.stringify(withMetaData, null, 2);
}