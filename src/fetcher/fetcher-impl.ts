import * as fetcher from './fetcher-base.js';

export async function setup(userId: string, password: string) {
    const cookie = await fetcher.getCookie();

    if (!await fetcher.login(cookie, userId, password)) {
        throw new Error('Login failed! Bad credentials.');
    }
    
    if (!await fetcher.loadSubMenu(cookie)) {
        throw new Error('Login session expired. (res set-cookie was not null)');
    }

    return cookie;
}

export async function getBoardListCount(cookie: string) {
    return await fetcher.getBoardListCount(cookie);
}

export async function needsUpdate(cookie: string, latestNttId: string) {
    return await fetcher.needsUpdate(cookie, latestNttId);
}

async function fetchIdList(cookie: string, count: number) {
    if (count < 0) throw new Error(`Negative count isn't a thing silly! (${count})`);

    const boardList = await fetcher.getBoardList(cookie, count);
    if (!boardList) throw new Error('Login session expired. (res set-cookie was not null)');

    const idList = fetcher.parseToIdList(boardList);

    return idList.toSpliced(count);
}

export async function fetchFileData(cookie: string, count: number) {
    const idList = await fetchIdList(cookie, count);

    return await fetcher.getFileDataFromIdList(cookie, idList);
}

export async function fetchFileDataAfter(cookie: string, latestNttId: string, count: number | null = null) {
    count = count ?? await fetcher.getBoardListCount(cookie);
    if (count === null) throw new Error('Failed to get boardListCount! Session expired or total unparsable.');

    const idList = await fetchIdList(cookie, count);

    let idIndex = idList.findIndex(id => id === latestNttId);
    idIndex = idIndex === -1 ? count : idIndex;

    idList.splice(idIndex);

    const fileData = await fetcher.getFileDataFromIdList(cookie, idList);
    if (!fileData) throw new Error('Failed to get boardDetail! Session expired.');

    return fileData;
}

export function exportJSON(fileData: fetcher.FileData[]) {
    return JSON.stringify({
        date: new Date().toISOString(),
        latestNttId: fileData[0]?.nttId ?? null,
        data: fileData
    }, null, 2);
}