// Trusted inline content only. Execute inside the final image with --network none.
// This checks the shipped application adapter, not an external provider session.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

assert.equal(process.argv.length, 2, 'Unexpected arguments');
assert.equal(process.platform, 'linux', 'Linux production image required');
assert.equal(process.versions.node, '26.12.1');
assert.equal(process.getuid(), 1000);
assert.equal(process.getgid(), 1000);
const release = Object.fromEntries(readFileSync('/etc/os-release', 'utf8').split('\n').filter(line=>line.includes('=')).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1).replace(/^"|"$/g,'')];}));
assert.equal(release.ID, 'ubuntu'); assert.equal(release.VERSION_ID, '26.10');
const glibc = process.report.getReport().header.glibcVersionRuntime;
assert.ok(typeof glibc === 'string' && glibc.length, 'GNU libc required');
const require = createRequire('/app/package.json');
assert.equal(require('playwright/package.json').version, '1.64.1');
const browserRequire = createRequire(require.resolve('playwright/package.json'));
const browsers = JSON.parse(readFileSync(join(dirname(browserRequire.resolve('playwright-core/package.json')), 'browsers.json'), 'utf8')).browsers;
const expected = browsers.find(browser=>browser.name==='chromium-headless-shell');
assert.ok(expected?.browserVersion && expected?.revision);
const adapterPath = '/app/dist/browser-automation.js';
const adapterSha256 = createHash('sha256').update(readFileSync(adapterPath)).digest('hex');
// Route application diagnostics to stderr so the evidence remains valid JSON.
console.log = (...args) => console.error(...args);
const {launchBrowser,createContext,closeBrowser} = await import(adapterPath);
const results = []; let requests = 0; const errors = [];
let browserVersion;
try {
  const browser = await launchBrowser(); browserVersion = browser.version();
  assert.equal(browserVersion, expected.browserVersion);
  for (const viewport of [{width:1440,height:960},{width:390,height:844}]) {
    const context = await createContext({viewport});
    try {
      await context.route('**/*',route=>route.abort('blockedbyclient'));
      context.on('request',()=>requests++);
      const page=await context.newPage(); page.on('pageerror',error=>errors.push(error.name));
      await page.setContent('<!doctype html><html><body><h1>Trusted browser fixture</h1><button type="button">Count: 0</button><script>document.querySelector("button").onclick=function(){this.textContent="Count: 1"}</script></body></html>');
      await page.getByRole('button',{name:'Count: 0'}).click();
      assert.equal(await page.getByRole('button').textContent(),'Count: 1');
      assert.equal(await page.getByRole('heading').textContent(),'Trusted browser fixture');
      results.push({viewport,javascriptAndDom:true});
    } finally { await context.close(); }
  }
  assert.equal(requests,0); assert.deepEqual(errors,[]);
} finally { await closeBrowser(); }
process.stdout.write(JSON.stringify({node:process.versions.node,os:release.ID,osVersion:release.VERSION_ID,glibc,uid:process.getuid(),gid:process.getgid(),playwright:'1.64.1',browserVersion,browserRevision:expected.revision,adapterSha256,results,requests,browserErrors:errors.length,trustedInlineFixtureOnly:true,chromiumSandbox:false,liveProvidersVerified:false,untrustedProviderSafetyVerified:false})+'\n');
