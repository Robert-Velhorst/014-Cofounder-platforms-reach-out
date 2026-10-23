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
import { summarizeUbuntuImageEvidence } from './summarize-ubuntu-image-evidence.mjs';
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
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  const job=workflow.split('  ubuntu-coverage:')[1].split('  windows-source:')[0];
  assert.equal((job.match(/--user "\$\(id -u\):\$\(id -g\)"/g)||[]).length,2);
  assert.equal((job.match(/--tmpfs \/tmp:rw,size=512m,mode=1777/g)||[]).length,2);
  assert.ok(job.includes('db search --pkg openssl --distro ubuntu:26.10 --provider ubuntu --limit 0 --output json'));
  const scan={distro:{name:'ubuntu',version:'26.10'},matches:[{fixture:true}],descriptor:{db:{built:'synthetic'}}};
  const feed=[{vulnerability:{provider:'ubuntu',status:'active',id:'synthetic-vulnerability'},packages:[{os:{name:'ubuntu',version:'26.10'},package:{name:'synthetic-package'}}]}];
  const result=validateUbuntuCoverage(scan,feed);
  assert.equal(result.ubuntuFeedCoverage,true); assert.equal(result.securityAcceptance,false); assert.equal(result.baseImageMatches,1);
  assert.throws(()=>validateUbuntuCoverage(scan,[]),/MISSING_UBUNTU_FEED_ROWS/);
  assert.throws(()=>validateUbuntuCoverage({...scan,distro:{name:'debian',version:'forky'}},feed),/WRONG_SCANNER_DISTRO/);
  assert.throws(()=>validateUbuntuCoverage(scan,[{...feed[0],packages:[]}]),/NO_ACTIVE_UBUNTU_2610_FEED_ROWS/);
  assert.throws(()=>validateUbuntuCoverage({...scan,matches:null},feed),/MISSING_CANDIDATE_REPORT/);
});

test('full Ubuntu evidence requires inventories, all direct dependencies, current DB and retained findings', () => {
  const now=Date.parse('2026-10-23T12:00:00Z');
  const sbom={descriptor:{name:'syft',version:'1.55.0'},distro:{name:'Ubuntu',id:'ubuntu',version:'26.10 (Stonking Stingray)',versionID:'26.10'},artifacts:[{id:'os1',name:'libc6',version:'2.44',type:'deb'},{id:'node1',name:'example',version:'1.0.0',type:'npm'}]};
  const config={'show-suppressed':true,'include-matcher-suppressions':true,'match-upstream-kernel-headers':true,'only-fixed':false,'only-notfixed':false,'ignore-wontfix':'',ignore:[],exclude:[],'vex-documents':[],'vex-add':[]};
  const scan={distro:{name:'ubuntu',version:'26.10'},matches:[{artifact:{id:'node1'}}],descriptor:{configuration:config,db:{status:{valid:true,built:'2026-10-23T06:30:00Z'},providers:{ubuntu:{captured:'2026-10-23T06:00:00Z'}}}}};
  const feed=[{vulnerability:{provider:'ubuntu',status:'active',id:'fixture'},packages:[{os:{name:'ubuntu',version:'26.10'},package:{name:'openssl'}}]}];
  const result=summarizeUbuntuImageEvidence(sbom,scan,feed,{example:'1.0.0'},now);
  assert.equal(result.evidenceComplete,true); assert.equal(result.securityAcceptance,false); assert.equal(result.findings,1);
  assert.throws(()=>summarizeUbuntuImageEvidence({...sbom,artifacts:sbom.artifacts.slice(1)},scan,feed,{},now),/MISSING_OS_INVENTORY/);
  assert.throws(()=>summarizeUbuntuImageEvidence(sbom,scan,feed,{missing:'1.0.0'},now),/MISSING_RUNTIME_DEPENDENCY/);
  assert.throws(()=>summarizeUbuntuImageEvidence(sbom,scan,[],{},now),/MISSING_UBUNTU_FEED_ROWS/);
  assert.throws(()=>summarizeUbuntuImageEvidence(sbom,{...scan,matches:[{artifact:{id:'unknown'}}]},feed,{},now),/FINDING_OUTSIDE_SBOM/);
  assert.throws(()=>summarizeUbuntuImageEvidence(sbom,scan,feed,{},now+6*86400000),/STALE_VULNERABILITY_DATABASE/);
  assert.throws(()=>summarizeUbuntuImageEvidence({...sbom,distro:{...sbom.distro,versionID:'26.04'}},scan,feed,{},now),/WRONG_SBOM_RELEASE/);
  assert.throws(()=>summarizeUbuntuImageEvidence(sbom,{...scan,ignoredMatches:null},feed,{},now),/INVALID_IGNORED_FINDINGS/);
  for (const [key,value] of [['include-matcher-suppressions',false],['only-fixed',true],['exclude',['/app/**']]]) assert.throws(()=>summarizeUbuntuImageEvidence(sbom,{...scan,descriptor:{...scan.descriptor,configuration:{...config,[key]:value}}},feed,{},now),/SCANNER_CONFIGURATION/);
  const collector=readFileSync(new URL('./capture-ubuntu-image-security.sh',import.meta.url),'utf8');
  assert.ok(collector.includes('--config /scan/config.yaml sbom:/scan/sbom.json'));
  const policy=readFileSync(new URL('./grype-image-evidence.yaml',import.meta.url),'utf8');
  for (const field of ['include-matcher-suppressions: true','show-suppressed: true','match-upstream-kernel-headers: true','ignore: []','exclude: []']) assert.ok(policy.includes(field));
});

test('Caddy uses current stable Alpine while preserving rootless runtime and persistent paths', () => {
  const dockerfile=readFileSync(new URL('../Dockerfile.hetzner-edge',import.meta.url),'utf8');
  assert.match(dockerfile,/FROM golang:1\.27\.3-alpine3\.24@sha256:[a-f0-9]{64} AS edge-build/);
  assert.match(dockerfile,/FROM alpine:3\.24\.3@sha256:[a-f0-9]{64}/);
  assert.doesNotMatch(dockerfile,/^FROM caddy:/m);
  for (const fragment of ['ca-certificates curl mailcap','XDG_CONFIG_HOME=/config XDG_DATA_HOME=/data','chown 1000:1000 /config /config/caddy /data /data/caddy','USER 1000:1000','EXPOSE 8080 8443','CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]']) assert.ok(dockerfile.includes(fragment));
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.ok(workflow.includes('test "$(cat output/caddy-os-release.txt)" = \'3.24.3\''));
});
