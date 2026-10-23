// The locally built main Go module has no version in debug.BuildInfo. Query
// its verified upstream source version explicitly, without altering a scan.
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateCaddyRootReceipt(receipt,now=Date.now()) {
  assert.equal(receipt?.schemaVersion,1,'INVALID_ROOT_QUERY_RECEIPT');
  assert.equal(receipt.source,'https://api.osv.dev/v1/query','WRONG_ROOT_QUERY_SOURCE');
  assert.equal(receipt.httpStatus,200,'FAILED_ROOT_QUERY');
  assert.deepEqual(receipt.query,{package:{name:'github.com/caddyserver/caddy/v2',ecosystem:'Go'},version:'v2.11.7'},'WRONG_ROOT_QUERY');
  const age=now-Date.parse(receipt.checkedAt);
  assert.ok(Number.isFinite(age) && age>=-3600000 && age<=86400000,'STALE_ROOT_QUERY');
  const response=receipt.response;
  assert.ok(response && typeof response==='object' && !Array.isArray(response),'INVALID_ROOT_QUERY_RESPONSE');
  assert.ok(Object.keys(response).every(key=>['vulns','next_page_token'].includes(key)),'INVALID_ROOT_QUERY_RESPONSE');
  if(Object.hasOwn(response,'next_page_token')) assert.equal(response.next_page_token,'','INCOMPLETE_ROOT_QUERY');
  if(Object.hasOwn(response,'vulns')) assert.ok(Array.isArray(response.vulns),'INVALID_ROOT_ADVISORIES');
  assert.equal((response.vulns??[]).length,0,'CADDY_ROOT_ADVISORIES_PRESENT');
  return {source:receipt.source,package:'github.com/caddyserver/caddy/v2',version:'v2.11.7',checkedAt:receipt.checkedAt,advisories:0};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  assert.match(readFileSync(new URL('../output/caddy-version.txt',import.meta.url),'utf8'),/^v2[.]11[.]7-cofounder[.]20261023[.]2(?:\s|$)/);
  const query={package:{name:'github.com/caddyserver/caddy/v2',ecosystem:'Go'},version:'v2.11.7'};
  const source='https://api.osv.dev/v1/query';
  const response=await fetch(source,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(query),signal:AbortSignal.timeout(30000)});
  let size=0;const chunks=[];
  for await(const chunk of response.body) {size+=chunk.byteLength;assert.ok(size<=1048576,'OVERSIZED_ROOT_QUERY');chunks.push(chunk);}
  const receipt={schemaVersion:1,source,query,httpStatus:response.status,checkedAt:new Date().toISOString(),response:JSON.parse(Buffer.concat(chunks).toString('utf8'))};
  writeFileSync(new URL('../output/caddy-root-advisories.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(validateCaddyRootReceipt(receipt)));
}
