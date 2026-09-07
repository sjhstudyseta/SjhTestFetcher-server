// implementation for this server with error handling
import * as fetcher from './fetcher-base.js';
import type { FileData } from './fetcher-types.js';

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
    const count = await fetcher.getBoardListCount(cookie);
    if (!count) throw new Error('Failed to get boardListCount! Session expired or total unparsable.');

    return count;
}

export async function getBoardList(cookie: string, count: number) {
    const boardList = await fetcher.getBoardList(cookie, count);
    if (!boardList) throw new Error('Login session expired. (res set-cookie was not null)');

    return boardList;
}

export async function getFileDataFromIdList(cookie: string, idList: (string | null)[]) {
    const fileData = await fetcher.getFileDataFromIdList(cookie, idList);
    if (!fileData) throw new Error('Failed to get boardDetail! Session expired.');

    return fileData;
}

export async function fetchIdList(cookie: string, count: number) {
    if (count < 0) throw new Error(`Negative count isn't a thing silly! (${count})`);

    const boardList = await getBoardList(cookie, count);

    return fetcher
        .parseToIdList(boardList)
        .toSpliced(count);
}

export async function fetchIdListAfter(cookie: string, nttId: string) {
    const count = await getBoardListCount(cookie);
    const idList = await fetchIdList(cookie, count);

    let idIndex = idList.findIndex(id => id === nttId);
    idIndex = idIndex === -1 ? 0 : idIndex;

    return idList.toSpliced(idIndex);
}

export function exportJSON(fileData: FileData[]) {
    return JSON.stringify({
        date: new Date().toISOString(),
        latestNttId: fileData[0]?.nttId ?? null,
        data: fileData
    }, null, 2);
}