import { HTMLElement, parse } from "node-html-parser"

const mainPageURL = "https://seoulsejong.sen.hs.kr";
const loginURL = "https://seoulsejong.sen.hs.kr/dggb/cmm/actionLogin.do";
const subMenuURL = "https://seoulsejong.sen.hs.kr/41012/subMenu.do";
const boardListURL = "https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardListAjax.do";
const boardDetailURL = "https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do";
const fileDownloadURL = (file: File) => `https://seoulsejong.sen.hs.kr/dggb/cnvrFileDown.do?atchFileId=${file.atchFileId}:${file.fileSn}`;

const testBankBBSId = "BBS_0000000000090317";

// get cookie string
export async function getCookie() {
    const mainPage = await fetch(mainPageURL);

    return mainPage
        .headers
        .getSetCookie()
        .map(e => e.split(";")[0])  // get cookie id, format: "id=value"
        .join("; ");
}

export async function login(cookie: string, userId: string, password: string) {
    const loginPage = await fetch(loginURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookie,
        },
        body: getLoginReqBody(userId, password),
        redirect: "manual"  // don't remove! need to distinguish login success
    });

    return loginPage.status === 302; // if 200: login fail, if 302: success
}

function getLoginReqBody(userId: string, password: string) {
    return new URLSearchParams({    // originally called from ssem.or.kr login service
        afterUrl: "seoulsejong.sen.hs.kr",  // tells ssem.or.kr where to redirect
        siteId: "SEI_00000739", // school id
        act: "userLogin",
        userId: userId,
        password: password
    }).toString();
}

function isValidResponse(res: Response) {
    return res.headers.getSetCookie().length === 0;  // invalid requests will receive new JSESSION cookie
}

// need this call first for other requests to work. don't know why.
// run this first to use functions below this one.
export async function loadSubMenu(cookie: string) {
    const subMenuRes = await fetch(subMenuURL, {
        method: "GET",
        headers: {
            "Cookie": cookie
        }
    });

    return isValidResponse(subMenuRes);
}

export async function getBoardList(cookie: string, count = 10) {  // run loadSubMenu before this
    const boardList = await fetch(boardListURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Cookie": cookie,
            "X-Requested-With": "XMLHttpRequest", // jQuery ajax calls add this. works without this line, but not sure.
        },                                        // original call uses ajax
        body: getBoardListReqBody(count)
    });

    if (!isValidResponse(boardList)) return null;

    return parse(await boardList.text());
}

function getBoardListReqBody(count: number) {
    return new URLSearchParams({
        bbsId: testBankBBSId,   // Bulitin Board System id
        bbsTyCode: "base",  // bbs type code
        customRecordCountPerPage: count.toString(),
        cmntSe: "N" // comment type = No? don't know what this is
    }).toString();
}

export function parseToIdList(boardList: HTMLElement) {
    const regex = /fnView\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/; // expected form: fnView('bbsId', 'nttId')   // ' is not same as "!!!

    return boardList.querySelectorAll(".samu").map(e => {
        const onclickString = e.getAttribute("onclick") || "";
        const match = onclickString.match(regex);

        return match?.at(2) ?? null; // only return nttId
    });
}

export async function getBoardListCount(cookie: string) {
    const boardList = await getBoardList(cookie);
    
    const strCount = boardList
        ?.querySelectorAll(".total").at(0)
        ?.textContent.slice(2, -1) ?? "";

    const count = parseInt(strCount);

    return isNaN(count) ? null : count;
}

export async function needsUpdate(cookie: string, latestNttId: string) {
    const boardList = await getBoardList(cookie);
    if (!boardList) return true;

    const idList = parseToIdList(boardList);
    if (idList.length === 0) return true;

    return idList[0] !== latestNttId;
}

export async function getBoardDetail(cookie: string, nttId: string) {
    const boardDetail = await fetch(boardDetailURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", // required to work
            "Cookie": cookie,
            "X-Requested-With": "XMLHttpRequest"
        },
        body: getBoardDetailReqBody(nttId),
    });

    if (!isValidResponse(boardDetail)) return null;

    return parse(await boardDetail.text());
}

function getBoardDetailReqBody(nttId: string) {
    return new URLSearchParams({
        bbsId: testBankBBSId,
        bbsTyCode: "base",
        cmntSe: "N",
        nttId: nttId    // this one has nttId
    }).toString();
}

export function parseBoardDetailTitle(boardDetail: HTMLElement) {
    return boardDetail
        .getElementsByTagName("th")
        .find(e => e.textContent.trim() === "제목")
        ?.closest("tr")
        ?.querySelector("td > div")
        ?.textContent.trim() ?? null;
}

export function parseBoardDetailFiles(boardDetail: HTMLElement) {
    const scriptText = boardDetail
        .getElementsByTagName("script")
        .find(e => e.textContent.includes("serverFileObj"))
        ?.textContent ?? "";

    // expected form (has to be in "name", "atchFileId", "fileSn" order):
    // serverFileObj["name"] = "filename.txt"
    // ...
    // serverFileObj["atchFileId"] = "FILE_01"
    // ...
    // serverFileObj["fileSn"] = "1"

    // ' is not same as "!!!

    const regex = /serverFileObj\["name"\]\s*=\s*"([^"]*)";[\s\S]*?serverFileObj\["atchFileId"\]\s*=\s*"([^"]*)";\s*serverFileObj\["fileSn"\]\s*=\s*"([^"]*)";/g;
    
    return scriptText.matchAll(regex).map((match): File => { // length might not be as expected if regex fails
        return {
            name: match[1] ?? null,
            atchFileId: match[2] ?? null,
            fileSn: match[3] ?? null
        };
    });
}

export type File = {
    name: string | null,
    atchFileId: string | null,
    fileSn: string | null
}

export type FileData = {
    nttId: string | null,
    title: string | null,
    files: { 
        name: string | null,
        url: string 
    }[];
}

export async function getFileDataFromIdList(cookie: string, idList: (string | null)[]) {
    const fileData: FileData[] = [];

    for (const nttId of idList) {
        if (!nttId) {
            fileData.push({ nttId: null, title: null, files: [] });
            continue;
        }

        const boardDetail = await getBoardDetail(cookie, nttId);
        if (!boardDetail) return null;

        fileData.push({
            nttId: nttId,
            title: parseBoardDetailTitle(boardDetail),
            files: parseBoardDetailFiles(boardDetail).map(f => {
                return { 
                    name: f.name,
                    url: fileDownloadURL(f) 
                } 
            }).toArray()
        });
    }

    return fileData;
}