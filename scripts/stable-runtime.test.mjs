import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { hooks } from '../.pnpmfile.mjs';
import { validateImageReport } from './check-image-security.mjs';
import { validateInstalledBrowserReport, assertBrowserProbeInvocation } from './check-installed-browser-report.mjs';
import { validateUbuntuCoverage } from './check-ubuntu-coverage.mjs';
const script = fileURLToPath(new URL('./stable-runtime.mjs', import.meta.url));
test('records actual interpreter without connecting to a database', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'cofounder-runtime-'));
  try {
    const child = spawnSync(process.execPath, [script], { cwd: fixture, encoding: 'utf8', timeout: 10_000 });
    assert.equal(child.status, 0, child.stderr);
    const report = JSON.parse(readFileSync(join(fixture, 'output/stable-runtime-verification.json'), 'utf8'));
    assert.equal(report.node, '26.12.1'); assert.equal(report.openssl, process.versions.openssl); assert.equal(report.mysql, undefined);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
for (const url of ['mysql://fixture:synthetic-password@127.0.0.1/production','mysql://fixture:synthetic-password@database.example/cofounder_test','mysql://fixture:synthetic-password@127.0.0.1/cofounder_test?ssl=false']) {
  test('rejects a non-fixture database before opening a connection: '+url, () => {
    const child = spawnSync(process.execPath, [script, '--database'], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 10_000 });
    assert.equal(child.status, 1); assert.match(child.stderr, /Disposable loopback/); assert.doesNotMatch(child.stderr, /synthetic-password|ECONNREFUSED/);
  });
}
test('omits only reviewed tRPC compiler peers while retaining the development compiler', () => {
  for (const name of ['@trpc/client','@trpc/server','@trpc/react-query']) assert.deepEqual(hooks.readPackage({name,version:'11.19.0',peerDependencies:{typescript:'>=5.7.2',react:'^19'}}).peerDependencies,{react:'^19'});
  assert.equal(hooks.readPackage({name:'@trpc/server',version:'12.0.0',peerDependencies:{typescript:'>=7'}}).peerDependencies.typescript,'>=7');
  const manifest = JSON.parse(readFileSync(new URL('../apps/cofounder-discovery/package.json',import.meta.url),'utf8'));
  assert.equal(manifest.devDependencies.typescript,'7.0.2');
  assert.ok(manifest.dependencies.playwright);
  assert.equal(manifest.dependencies['@sparticuz/chromium'],undefined); assert.equal(manifest.dependencies['puppeteer-core'],undefined);
});
test('image evidence requires both inventories and rejects findings or build compilers', () => {
  const report = { SchemaVersion: 2, ArtifactType: 'container_image', Metadata: { OS: { Family: 'ubuntu', Name: '26.10', EOSL: false } }, Results: [
    { Target: 'ubuntu', Class: 'os-pkgs', Type: 'ubuntu', Packages: [{ Name: 'libc6', Version: '2.41' }] },
    { Target: 'node', Class: 'lang-pkgs', Type: 'node-pkg', Packages: [{ Name: 'example', Version: '1.0.0' }] },
  ] };
  assert.equal(validateImageReport(report, {example:'1.0.0'}).passed,true);
  assert.throws(()=>validateImageReport({...report,Metadata:{OS:{Family:'debian',Name:'13',EOSL:false}}},{}),/INVALID_REPORT/);
  assert.throws(()=>validateImageReport({...report,Metadata:{OS:{Family:'ubuntu',Name:'26.04',EOSL:false}}},{}),/INVALID_REPORT/);
  assert.throws(()=>validateImageReport(report,{missing:'1.0.0'}),/MISSING_RUNTIME_DEPENDENCY/);
  assert.throws(()=>validateImageReport({...report,Results:report.Results.slice(1)},{}),/MISSING_OS_INVENTORY/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[0],Vulnerabilities:[{}]}]},{}),/VULNERABILITIES_PRESENT/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[0],ExperimentalModifiedFindings:[{}]}]},{}),/SUPPRESSED_FINDINGS/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[1],Packages:[{Name:'typescript',Version:'7.0.2'}]}]},{}),/BUILD_COMPILER_IN_RUNTIME/);
});

if (process.platform === 'win32') test('installed browser evidence refuses a host run before importing application code', () => {
  const child=spawnSync(process.execPath,[fileURLToPath(new URL('./check-installed-browser.mjs',import.meta.url))],{encoding:'utf8',timeout:10_000});
  assert.equal(child.status,1); assert.match(child.stderr,/Linux production image required/); assert.equal(child.stdout,'');
});

test('native browser evidence cannot pass with missing stdin, an empty report or incomplete interaction', () => {
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  assertBrowserProbeInvocation(workflow);
  assert.throws(()=>assertBrowserProbeInvocation(workflow.replace('--init --interactive','--init')),/INCOMPLETE_BROWSER_INVOCATION/);
  assert.throws(()=>assertBrowserProbeInvocation(workflow.replace('test -s output/installed-browser-verification.json','true')),/INCOMPLETE_BROWSER_INVOCATION/);
  const report={node:'26.12.1',os:'ubuntu',osVersion:'26.10',uid:1000,gid:1000,playwright:'1.64.1',requests:0,browserErrors:0,trustedInlineFixtureOnly:true,chromiumSandbox:false,liveProvidersVerified:false,untrustedProviderSafetyVerified:false,glibc:'2.44',browserVersion:'150.0.1.2',browserRevision:'1234',adapterSha256:'a'.repeat(64),results:[{viewport:{width:1440,height:960},javascriptAndDom:true},{viewport:{width:390,height:844},javascriptAndDom:true}]};
  assert.equal(validateInstalledBrowserReport(report).passed,true);
  for (const mutation of [null,{}, {...report,requests:1},{...report,results:[]},{...report,adapterSha256:''},{...report,browserVersion:''},{...report,uid:0}]) assert.throws(()=>validateInstalledBrowserReport(mutation));
  assert.throws(()=>JSON.parse(''));
});

test('candidate Ubuntu coverage requires real release records and does not assert security acceptance', () => {
  const scan={distro:{name:'ubuntu',version:'26.10'},matches:[{fixture:true}],descriptor:{db:{built:'synthetic'}}};
  const feed=[{vulnerability:{provider:'ubuntu',status:'active',id:'synthetic-vulnerability'},packages:[{os:{name:'ubuntu',version:'26.10'},package:{name:'synthetic-package'}}]}];
  const result=validateUbuntuCoverage(scan,feed);
  assert.equal(result.ubuntuFeedCoverage,true); assert.equal(result.securityAcceptance,false); assert.equal(result.baseImageMatches,1);
  assert.throws(()=>validateUbuntuCoverage(scan,[]),/MISSING_UBUNTU_FEED_ROWS/);
  assert.throws(()=>validateUbuntuCoverage({...scan,distro:{name:'debian',version:'forky'}},feed),/WRONG_SCANNER_DISTRO/);
  assert.throws(()=>validateUbuntuCoverage(scan,[{...feed[0],packages:[]}]),/NO_ACTIVE_UBUNTU_2610_FEED_ROWS/);
  assert.throws(()=>validateUbuntuCoverage({...scan,matches:null},feed),/MISSING_CANDIDATE_REPORT/);
});
