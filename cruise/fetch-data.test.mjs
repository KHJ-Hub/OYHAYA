import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSchedules} from './fetch-data.mjs';
const row = {vslNm:'TEST SHIP',ptentPrnmntDt:'2026-10-17 08:00',dfptPrnmntDt:'2026-10-17 18:00',poent:'부산',psngPscp:'2000',bfrPrt:'이전항',nextPrt:'다음항',dataCrtrYmd:'2026-10-16'};
const reply = (items,totalCount=1) => ({ok:true,status:200,text:async()=>JSON.stringify({response:{header:{resultCode:'00'},body:{items:{item:items},totalCount}}})});
test('maps documented fields and handles a single item object',async()=>{
 const [out]=await fetchSchedules('test-key',async url=>{assert.equal(url.searchParams.get('serviceKey'),'test-key');return reply(row)});
 assert.deepEqual(out,{id:1,date:'2026-10-17',ship:'TEST SHIP',arrival:row.ptentPrnmntDt,departure:row.dfptPrnmntDt,terminal:'부산',passengers:'2000',previousPort:'이전항',nextPort:'다음항',dataDate:'2026-10-16'});
});
test('collects every page',async()=>{
 const pages=[];const out=await fetchSchedules('test%2Bkey',async url=>{pages.push(url.searchParams.get('pageNo'));assert.equal(url.searchParams.get('serviceKey'),'test+key');return reply([row],2)});
 assert.equal(out.length,2);assert.deepEqual(pages,['1','2']);
});
test('reports gateway code without echoing credentials',async()=>{
 await assert.rejects(fetchSchedules('secret-value',async()=>({ok:false,status:400,text:async()=>JSON.stringify({OpenAPI_ServiceResponse:{cmmMsgHeader:{returnReasonCode:'10',errMsg:'secret-value'}}})})),/^Error: Official API error code 10 \(HTTP 400\)/);
});
test('rejects empty, incomplete and malformed date results',async()=>{
 await assert.rejects(fetchSchedules('test',async()=>reply([],0)),/zero schedules/);
 let page=0;await assert.rejects(fetchSchedules('test',async()=>reply(++page===1?[row]:[],2)),/Incomplete/);
 await assert.rejects(fetchSchedules('test',async()=>reply({...row,ptentPrnmntDt:'2026-02-30'})),/Invalid arrival/);
});
test('rejects missing secret, non-JSON and unexpected schema',async()=>{
 await assert.rejects(fetchSchedules(''),/Missing/);
 await assert.rejects(fetchSchedules('test',async()=>({ok:true,status:200,text:async()=>'<xml>'})),/non-JSON/);
 await assert.rejects(fetchSchedules('test',async()=>({ok:true,status:200,text:async()=>'{}'})),/Unrecognized/);
});
