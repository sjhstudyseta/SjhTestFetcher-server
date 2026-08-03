import { config } from 'dotenv'
import * as fetcherImpl from './fetcher-impl.js';

// config .env
config({ quiet: true });
const userId = process.env.USER_ID;
const password = process.env.PASSWORD;


const cookieStr = await fetcherImpl.setup(userId, password);

const fileData1 = await fetchData(cookieStr, null, '27314308');
const fileData2 = await fetchData(cookieStr, 3, null);
const fileData3 = await fetchData(cookieStr, 1, '27314308');
const fileData4 = await fetchData(cookieStr, null, null);
const fileData5 = await fetchData(cookieStr, 12, '12312311123');
const fileData6 = await fetchData(cookieStr, null, '13978726');



async function fetchData(cookieStr, countParam, afterParam) {
  let fileData = null;

  if (validNum(countParam) && !afterParam) { // not null, null
    fileData = await fetcherImpl.fetchFileData(cookieStr, countParam);
  } 
  else if (!validNum(countParam) && afterParam) { // null, not null
    if (!await fetcherImpl.needsUpdate(cookieStr, afterParam)) return 'Up to date.';

    fileData = await fetcherImpl.fetchFileDataAfter(cookieStr, afterParam);
  } 
  else if (validNum(countParam) && afterParam) {  // not null, not null
    if (countParam == 0 || !await fetcherImpl.needsUpdate(cookieStr, afterParam)) return 'Up to date.';

    fileData = await fetcherImpl.fetchFileDataAfter(cookieStr, afterParam, countParam);
  }
  else { // null, null
    let count = await fetcherImpl.getBoardListCount(cookieStr);
    fileData = count ? await fetcherImpl.fetchFileData(cookieStr, count) : null;
  }

  if (!fileData) {
    throw new Error(`fileData is null. ${countParam}, ${afterParam}`);
  }

  return fetcherImpl.exportJSON(fileData);
}

function validNum(any) {
  return any !== null && !isNaN(any) && any >= 0; 
}