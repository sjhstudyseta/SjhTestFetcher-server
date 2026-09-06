import * as fetcherImpl from './fetcher/fetcher-impl.js';
import type { FileData } from './fetcher/fetcher-types.js';

export async function fetchFileData(cookie: string): Promise<FileData[]>;
export async function fetchFileData(cookie: string, count: number): Promise<FileData[]>;

export async function fetchFileData(cookie: string, count?: number) {
    if (!count) return await noQuery(cookie);
    else return await countQuery(cookie, count);
}

export async function fetchFileDataAfter(cookie: string, nttId: string): Promise<FileData[]>
export async function fetchFileDataAfter(cookie: string, nttId: string, count: number): Promise<FileData[]>

export async function fetchFileDataAfter(cookie: string, nttId: string, count?: number) {
    if (!count) return await afterQuery(cookie, nttId);
    else return await afterCountQuery(cookie, nttId, count);
}

async function noQuery(cookie: string) {
    const count = await fetcherImpl.getBoardListCount(cookie);
    
    return await countQuery(cookie, count);
}

async function countQuery(cookie: string, count: number) {
    const idList = await fetcherImpl.fetchIdList(cookie, count);

    return await fetcherImpl.getFileDataFromIdList(cookie, idList);
}

async function afterQuery(cookie: string, nttId: string) {
    const idList = await fetcherImpl.fetchIdListAfter(cookie, nttId);

    return await fetcherImpl.getFileDataFromIdList(cookie, idList);
}

async function afterCountQuery(cookie: string, nttId: string, count: number) {
    const idList = await fetcherImpl.fetchIdListAfter(cookie, nttId);

    let deleteCount = idList.length - count;
    deleteCount = deleteCount < 0 ? 0 : deleteCount;

    idList.splice(0, deleteCount);

    return await fetcherImpl.getFileDataFromIdList(cookie, idList);
}