// actions by query
import * as fetcherImpl from '../fetcher/fetcher-impl.js';

async function fetchFileData(cookie: string, nttId?: string, count?: number) {
    if (nttId) {
        return count ? await afterCountQuery(cookie, nttId, count) : await afterQuery(cookie, nttId);
    }
    else {
        return count ? await countQuery(cookie, count) : await noQuery(cookie);
    }
}

export default fetchFileData;

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