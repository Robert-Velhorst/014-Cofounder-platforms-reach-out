import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateInstalledBrowserReport(report) {
  assert.ok(report && typeof report==='object' && !Array.isArray(report), 'MISSING_BROWSER_REPORT');
  for (const [key,value] of Object.entries({node:'26.12.1',os:'ubuntu',osVersion:'26.10',uid:1000,gid:1000,playwright:'1.64.1',requests:0,browserErrors:0,trustedInlineFixtureOnly:true,chromiumSandbox:false,liveProvidersVerified:false,untrustedProviderSafetyVerified:false})) assert.equal(report[key],value,'BROWSER_'+key);
  assert.match(report.glibc,/^\d+\.\d+(?:\.\d+)?$/,'MISSING_GNU_LIBC');
  assert.match(report.browserVersion,/^\d+\.\d+\.\d+\.\d+$/,'MISSING_BROWSER_VERSION');
  assert.match(report.browserRevision,/^\d+$/,'MISSING_BROWSER_REVISION');
  assert.match(report.adapterSha256,/^[a-f0-9]{64}$/,'MISSING_ADAPTER_HASH');
  assert.equal(report.results?.length,2,'MISSING_BROWSER_VIEWPORTS');
  for (const [index,viewport] of [{width:1440,height:960},{width:390,height:844}].entries()) {
    assert.deepEqual(report.results[index].viewport,viewport,'INVALID_BROWSER_VIEWPORT');
    assert.equal(report.results[index].javascriptAndDom,true,'DOM_NOT_VERIFIED');
  }
  return {passed:true,scope:'trusted inline fixture only',viewports:2,browserVersion:report.browserVersion};
}
export function assertBrowserProbeInvocation(workflow) {
  const parts=workflow.replaceAll('\r\n','\n').split('      - name: Verify installed Chromium through the application adapter\n');
  assert.equal(parts.length,2,'MISSING_NATIVE_BROWSER_STEP');
  const step=parts[1].split('      - name:')[0];
  for (const fragment of ['--interactive','--network none','--read-only','--cap-drop ALL','< scripts/check-installed-browser.mjs','test -s output/installed-browser-verification.json','node scripts/check-installed-browser-report.mjs']) assert.ok(step.includes(fragment),'INCOMPLETE_BROWSER_INVOCATION: '+fragment);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const report=JSON.parse(readFileSync(new URL('../output/installed-browser-verification.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(validateInstalledBrowserReport(report)));
}
