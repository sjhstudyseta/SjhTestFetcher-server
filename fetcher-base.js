import * as cheerio from 'cheerio';

const mainPageURL = 'https://seoulsejong.sen.hs.kr';
const loginURL = 'https://seoulsejong.sen.hs.kr/dggb/cmm/actionLogin.do';
const subMenuURL = 'https://seoulsejong.sen.hs.kr/41012/subMenu.do';
const boardListURL = 'https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardListAjax.do';
const boardDetailURL = 'https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do';

const testBankBBSId = 'BBS_0000000000090317';

export async function getCookieStr() {
    const mainPageRes = await fetch(mainPageURL);
    const cookies = mainPageRes.headers.getSetCookie();
    return cookies.map(e => e.split(';')[0]).join('; ');
}

export async function login(cookieStr, userId, password) {
    const loginRes = await fetch(loginURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieStr,
        },
        body: getLoginReqBody(userId, password),
        redirect: 'manual'  // don't remove! need to distinguish login success
    });

    return loginRes.status == 302; // if 200: login fail, if 302: success
}

function getLoginReqBody(userId, password) {
    return new URLSearchParams({
        afterUrl: "seoulsejong.sen.hs.kr",
        siteId: "SEI_00000739",
        act: "userLogin",
        userId: userId,
        password: password
    }).toString();
}

function isValidResponse(res) {
    return res.headers.getSetCookie().length === 0;  // unauthorized requests will receive new JSESSION cookie
}

export async function loadSubMenu(cookieStr) {
    const subMenuRes = await fetch(subMenuURL, {
        method: 'GET',
        headers: {
            'Cookie': cookieStr
        }
    }); // need this call first for other requests to work. don't know why.

    return isValidResponse(subMenuRes);
}

export async function getBoardList(cookieStr, count = 10) {  // run loadSubMenu before this
    const boardListRes = await fetch(boardListURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookieStr,
            'X-Requested-With': 'XMLHttpRequest', // jQuery ajax calls add this. works without this line, but not sure.
        },                                        // original call uses ajax
        body: getBoardListReqBody(count),   // raw form
    });

    if (!isValidResponse(boardListRes)) return null;

    const text = await boardListRes.text();

    return cheerio.load(text);
}

function getBoardListReqBody(count) {
    return new URLSearchParams({
        bbsId: testBankBBSId,
        bbsTyCode: 'base',
        customRecordCountPerPage: count,
        cmntSe: 'N'
    }).toString();
}

export function parseToIdList($boardList) {
    const anchors = $boardList('.samu').toArray();

    const regex = /fnView\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/; // expected form: fnView("bbsId", "nttId")

    const idList = anchors.map(e => {
        const $e = $boardList(e);

        const onclickString = $e.attr('onclick') || '';
        const match = onclickString.match(regex);

        return match ? match[2] : null; // only return nttId
	});

    return idList;
}

export async function getBoardListCount(cookieStr) {
    const $boardList = await getBoardList(cookieStr);
    if (!$boardList) return null;

    const totals = $boardList('.total').toArray();
    if (totals.length === 0) return null;

    const total = parseInt($boardList(totals[0]).text().slice(2,-1));
    if (!total) return null;

    return total;
}

export async function needsUpdate(cookieStr, latestNttId) {
    const $boardList = await getBoardList(cookieStr);
    if (!$boardList) return true;

    const idList = parseToIdList($boardList);
    if (idList.length === 0) return true;

    return idList[0] !== latestNttId;
}

export async function getBoardDetail(cookieStr, nttId) {
    const boardDetailRes = await fetch(boardDetailURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', // required to work
            'Cookie': cookieStr,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: getBoardDetailReqBody(nttId),
    });

    if (!isValidResponse(boardDetailRes)) return null;

    const text = await boardDetailRes.text();

    return cheerio.load(text);
}

function getBoardDetailReqBody(nttId) {
    return new URLSearchParams({
        bbsId: testBankBBSId,
        bbsTyCode: 'base',
        cmntSe: 'N',
        nttId: nttId
    }).toString();
}

export function parseBoardDetailTitle($boardDetail) {
    const ths = $boardDetail('th').toArray();
    const titleTh = ths.find(th => $boardDetail(th).text().trim() === '제목');

    if (!titleTh) return null;

    const $row = $boardDetail(titleTh).closest('tr');
    const $div = $row.find('td > div');

    const text = $div.length ? $div.text().trim() : null;

    return text;
}

export function parseBoardDetailFiles($boardDetail) {
    const scripts = $boardDetail('script').toArray();
    const target = scripts.find(e => $boardDetail(e).text().includes('serverFileObj'));
    const scriptText = target ? $boardDetail(target).text() : '';

    // expected form (has to be in "name", "atchFileId", "fileSn" order):
    // serverFileObj["name"] = "filename.txt"
    // ...
    // serverFileObj["atchFileId"] = "FILE_01"
    // ...
    // serverFileObj["fileSn"] = "1"

    const regex = /serverFileObj\["name"\]\s*=\s*"([^"]*)";[\s\S]*?serverFileObj\["atchFileId"\]\s*=\s*"([^"]*)";\s*serverFileObj\["fileSn"\]\s*=\s*"([^"]*)";/g;

    let files = [];
    let match;
    while ((match = regex.exec(scriptText)) !== null) {  // length might not be as expected if regex fails
        files.push({
            name: match[1],
            atchFileId: match[2],
            fileSn: match[3]
        });
    }

    return files;
}

function createDownloadURL(file) {
  return `https://seoulsejong.sen.hs.kr/dggb/cnvrFileDown.do?atchFileId=${file.atchFileId}:${file.fileSn}`;
}

export async function getFileDataFromIdList(cookieStr, idList) {
    let fileData = [];

    for (const nttId of idList) {
        let $detail = await getBoardDetail(cookieStr, nttId);

        fileData.push({
            nttId: nttId,
            title: $detail ? parseBoardDetailTitle($detail) : null,
            files: $detail ? parseBoardDetailFiles($detail).map(f => { return {name: f.name, url: createDownloadURL(f)} }) : null
        });
    }

    return fileData;
}