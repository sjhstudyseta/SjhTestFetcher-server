import { HTMLElement, parse } from "node-html-parser"

const mainPageURL = "https://seoulsejong.sen.hs.kr";
const loginURL = "https://seoulsejong.sen.hs.kr/dggb/cmm/actionLogin.do";
const subMenuURL = "https://seoulsejong.sen.hs.kr/41012/subMenu.do";
const boardListURL = "https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardListAjax.do";
const boardDetailURL = "https://seoulsejong.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do";

const testBankBBSId = "BBS_0000000000090317";

// get cookie string
export async function getCookie() {
    const mainPage = await fetch(mainPageURL);

    return mainPage
        .headers
        .getSetCookie()
        .map(e => e.split(";")[0])  // get cookie id, value: "id=value"
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

    return loginPage.status == 302; // if 200: login fail, if 302: success
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
    return res.headers.getSetCookie().length === 0;  // unauthorized requests will receive new JSESSION cookie
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
    const regex = /fnView\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/; // expected form: fnView("bbsId", "nttId")

    return boardList.querySelectorAll(".samu")
        .map(e => {
            const onclickString = e.getAttribute("onclick") || "";
            const match = onclickString.match(regex);

            return match ? match[2] : null; // only return nttId
        });
}

export async function getBoardListCount(cookie: string) {
    const boardList = await getBoardList(cookie);
    if (!boardList) return null;

    const totalElement = boardList.querySelectorAll(".total").at(0);
    if (!totalElement) return null;

    const total = parseInt(totalElement.textContent.slice(2, -1));
    if (!total) return null;

    return total;
}