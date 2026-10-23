import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { hooks } from '../.pnpmfile.mjs';
import { validateImageReport } from './check-image-security.mjs';
import { validateInstalledBrowserReport, assertBrowserProbeInvocation } from './check-installed-browser-report.mjs';
import { validateUbuntuCoverage } from './check-ubuntu-coverage.mjs';
import { summarizeUbuntuImageEvidence } from './summarize-ubuntu-image-evidence.mjs';
import { assessCaddyAdvisory } from './assess-caddy-advisory.mjs';
import { verifyUbuntuImageSecurity, canonicalDpkgVersion, resolvePrivateComponent } from './verify-ubuntu-image-security.mjs';
import { verifyNativePackageSecurity } from './verify-native-package-security.mjs';
import { validateCaddyRootReceipt } from './check-caddy-root-advisories.mjs';
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

function caddySecurityFixture() {
  const hash=value=>createHash('sha256').update(value).digest('hex');
  const paths=['golang.org/x/crypto/openpgp','golang.org/x/crypto/openpgp/packet','golang.org/x/crypto/openpgp/armor','golang.org/x/crypto/openpgp/clearsign','golang.org/x/crypto/openpgp/errors','golang.org/x/crypto/openpgp/elgamal','golang.org/x/crypto/openpgp/s2k'];
  const advisory={id:'GO-2026-5932',affected:[{package:{name:'golang.org/x/crypto',ecosystem:'Go'},ecosystem_specific:{imports:paths.map(path=>({path}))}}]};
  const linkedPackages=['github.com/caddyserver/caddy/v2/cmd/caddy','golang.org/x/crypto/hkdf',...Array.from({length:1000},(_,index)=>'fixture/pkg'+index)].sort().join('\n')+'\n';
  const buildInfo='/out/caddy: go1.27.3\n\tpath\tgithub.com/caddyserver/caddy/v2/cmd/caddy\n\tdep\tgolang.org/x/crypto\tv0.58.0\tfixture\n\tbuild\tCGO_ENABLED=0\n\tbuild\tGOARCH=amd64\n\tbuild\tGOOS=linux\n\tbuild\t-trimpath=true\n';
  const environmentText=JSON.stringify({CGO_ENABLED:'0',GOARCH:'amd64',GOOS:'linux',GOVERSION:'go1.27.3'},null,'\t')+'\n';
  const manifest={binarySha256:'a'.repeat(64),linkedPackagesSha256:hash(linkedPackages),buildInfoSha256:hash(buildInfo),buildEnvironmentSha256:hash(environmentText),sourceSha256:'bb250cdef3e4baad82af6c048ac9754b4d1350d50a55af7c34e8d1aa574a6211',package:'./cmd/caddy',trimpath:true};
  const scan={SchemaVersion:2,ArtifactType:'container_image',Metadata:{ImageID:'sha256:'+'e'.repeat(64),OS:{Family:'alpine',Name:'3.24.3'}},Results:[{Target:'alpine',Class:'os-pkgs',Type:'alpine',Packages:[{Name:'musl',Version:'fixture'}]},{Target:'usr/bin/caddy',Class:'lang-pkgs',Type:'gobinary',Packages:[{Name:'golang.org/x/crypto',Version:'v0.58.0'},{Name:'stdlib',Version:'v1.27.3'},{Name:'github.com/caddyserver/caddy/v2'}],Vulnerabilities:[{VulnerabilityID:'GO-2026-5932',PkgName:'golang.org/x/crypto',InstalledVersion:'v0.58.0'}]}]};
  return {advisory,scan,linkedPackages,buildInfo,environmentText,buildHash:'a'.repeat(64)+'  /out/caddy\n',runtimeHash:'a'.repeat(64)+'  /usr/bin/caddy\n',manifest,version:'v2.11.7-cofounder.20261023.2\n'};
}
test('Caddy applicability binds exact advisory scope and compile graph to the actual runtime hash', () => {
  const hash=value=>createHash('sha256').update(value).digest('hex');
  const input=caddySecurityFixture(); const {advisory,scan,linkedPackages,environmentText,manifest}=input;
  const result=assessCaddyAdvisory(input);
  assert.equal(result.decision,'not_affected'); assert.equal(result.rawAdvisoryFindingsRetained,1); assert.equal(result.wholeImageSecurityAcceptance,false);
  assert.throws(()=>assessCaddyAdvisory({...input,runtimeHash:'b'.repeat(64)+'  /usr/bin/caddy\n'}),/BUILD_RUNTIME_HASH_MISMATCH/);
  assert.throws(()=>assessCaddyAdvisory({...input,linkedPackages:linkedPackages+'unmatched/pkg\n'}),/BUILD_MANIFEST_MISMATCH/);
  const withOpenPgp=linkedPackages+'golang.org/x/crypto/openpgp\n';
  assert.throws(()=>assessCaddyAdvisory({...input,linkedPackages:withOpenPgp,manifest:{...manifest,linkedPackagesSha256:hash(withOpenPgp)}}),/VULNERABLE_PACKAGE_INCLUDED/);
  const short='github.com/caddyserver/caddy/v2/cmd/caddy\ngolang.org/x/crypto/hkdf\n';
  assert.throws(()=>assessCaddyAdvisory({...input,linkedPackages:short,manifest:{...manifest,linkedPackagesSha256:hash(short)}}),/INCOMPLETE_COMPILE_GRAPH/);
  assert.throws(()=>assessCaddyAdvisory({...input,advisory:{...advisory,affected:[{...advisory.affected[0],ecosystem_specific:{imports:[{path:'golang.org/x/crypto/ssh'}]}}]}}),/CHANGED_ADVISORY_SCOPE/);
  assert.throws(()=>assessCaddyAdvisory({...input,environmentText:environmentText.replace('"0"','"1"')}),/WRONG_BUILD_ENVIRONMENT/);
  assert.throws(()=>assessCaddyAdvisory({...input,manifest:{...manifest,buildEnvironmentSha256:''}}),/BUILD_MANIFEST_MISMATCH/);
  assert.throws(()=>assessCaddyAdvisory({...input,scan:{...scan,Metadata:{OS:{Family:'alpine',Name:'3.23.7'}}}}),/WRONG_EDGE_OS/);
  const otherScan=structuredClone(scan); otherScan.Results[1].Vulnerabilities.push({VulnerabilityID:'fixture-other'});
  assert.equal(assessCaddyAdvisory({...input,scan:otherScan}).otherFindings,1);
  const dockerfile=readFileSync(new URL('../Dockerfile.hetzner-edge',import.meta.url),'utf8');
  for (const fragment of ['sha256sum /out/caddy /out/linked-packages.txt /out/build-info.txt /out/build-environment.json','/usr/share/caddy/build-evidence.json']) assert.ok(dockerfile.includes(fragment));
});

test('native policy accepts only proved package absence and rejects every other finding or stale root query', () => {
  const now=Date.parse('2026-10-23T12:00:00Z');
  const rootReceipt={schemaVersion:1,source:'https://api.osv.dev/v1/query',httpStatus:200,query:{package:{name:'github.com/caddyserver/caddy/v2',ecosystem:'Go'},version:'v2.11.7'},checkedAt:'2026-10-23T11:59:00Z',response:{}};
  const caddy=caddySecurityFixture(); const edgeImageID=caddy.scan.Metadata.ImageID,databaseImageID='sha256:'+'d'.repeat(64);
  const database={SchemaVersion:2,ArtifactType:'container_image',Metadata:{ImageID:databaseImageID,OS:{Family:'oracle',Name:'9.8'}},Results:[{Target:'db',Class:'os-pkgs',Type:'oracle',Packages:[{Name:'mysql-community-server-minimal',Version:'26.10.0'}]}]};
  const input={caddy,database,edgeImageID,databaseImageID,mysqlVersion:'/usr/sbin/mysqld  Ver 26.10.0 for Linux on x86_64\n',rootReceipt,now};
  const result=verifyNativePackageSecurity(input);
  assert.equal(result.passed,true); assert.equal(result.applicableFindings,0); assert.equal(result.rawFindingsRetained,1); assert.equal(result.notAffectedFindings,1); assert.equal(result.wholeImageSecurityAcceptance,false);
  const vulnerable=structuredClone(caddy); vulnerable.scan.Results[1].Vulnerabilities.push({VulnerabilityID:'fixture-other'});
  assert.throws(()=>verifyNativePackageSecurity({...input,caddy:vulnerable}),/APPLICABLE_EDGE_FINDINGS/);
  const badDatabase=structuredClone(database); badDatabase.Results[0].Vulnerabilities=[{VulnerabilityID:'fixture-database'}];
  assert.throws(()=>verifyNativePackageSecurity({...input,database:badDatabase}),/DATABASE_FINDINGS_PRESENT/);
  assert.throws(()=>verifyNativePackageSecurity({...input,edgeImageID:databaseImageID}),/MIXED_EDGE_IMAGE/);
  assert.throws(()=>verifyNativePackageSecurity({...input,databaseImageID:edgeImageID}),/MIXED_DATABASE_IMAGE/);
  assert.throws(()=>verifyNativePackageSecurity({...input,rootReceipt:{...rootReceipt,response:{vulns:[{id:'fixture'}]}}}),/CADDY_ROOT_ADVISORIES_PRESENT/);
  assert.throws(()=>validateCaddyRootReceipt({...rootReceipt,response:{next_page_token:'more'}},now),/INCOMPLETE_ROOT_QUERY/);
  assert.throws(()=>validateCaddyRootReceipt({...rootReceipt,httpStatus:500},now),/FAILED_ROOT_QUERY/);
  assert.throws(()=>validateCaddyRootReceipt({...rootReceipt,response:{code:500}},now),/INVALID_ROOT_QUERY_RESPONSE/);
  assert.throws(()=>validateCaddyRootReceipt(rootReceipt,now+2*86400000),/STALE_ROOT_QUERY/);
  const missing=structuredClone(caddy); missing.scan.Results[1].Packages=missing.scan.Results[1].Packages.filter(pkg=>pkg.Name!=='golang.org/x/crypto');
  assert.throws(()=>verifyNativePackageSecurity({...input,caddy:missing}),/MISSING_LINKED_MODULE_INVENTORY/);
  const workflow=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.ok(workflow.includes('node scripts/verify-native-package-security.mjs > output/native-package-security-verification.json'));
});

test('Ubuntu package policy cross-checks image identity, inventories and every scanner finding', () => {
  const hash=value=>'sha256:'+createHash('sha256').update(value).digest('hex');
  const now=Date.parse('2026-10-23T12:00:00Z');
  const imageConfig=JSON.stringify({os:'linux',architecture:'amd64'}),imageID=hash(imageConfig);
  const imageManifest=JSON.stringify({config:{digest:imageID}}),manifestDigest=hash(imageManifest);
  const metadata={imageID,manifestDigest,manifest:Buffer.from(imageManifest).toString('base64'),config:Buffer.from(imageConfig).toString('base64')};
  const sbom={descriptor:{name:'syft',version:'1.55.0',configuration:{search:{scope:'squashed'},catalogers:{used:['dpkg-db-cataloger','javascript-package-cataloger','binary-classifier-cataloger']}}},distro:{name:'Ubuntu',id:'ubuntu',versionID:'26.10'},source:{type:'image',metadata},artifacts:[{id:'os',type:'deb',name:'libc6',version:'1:2.44-1ubuntu2'},{id:'npm',type:'npm',name:'example',version:'1.0.0'},{id:'bin',type:'binary',name:'node',version:'26.12.1'}]};
  const configuration={'show-suppressed':true,'include-matcher-suppressions':true,'match-upstream-kernel-headers':true,'only-fixed':false,'only-notfixed':false,'ignore-wontfix':'',ignore:[],exclude:[],'vex-documents':[],'vex-add':[]};
  const scan={distro:{name:'ubuntu',version:'26.10'},source:{type:'image',target:{imageID,manifestDigest}},matches:[],descriptor:{name:'grype',version:'0.121.0',configuration,db:{status:{valid:true,built:'2026-10-23T06:30:00Z'},providers:{ubuntu:{captured:'2026-10-23T06:00:00Z'}}}}};
  const feed=[{vulnerability:{provider:'ubuntu',status:'active',id:'fixture'},packages:[{os:{name:'ubuntu',version:'26.10'},package:{name:'openssl'}}]}];
  const trivy={SchemaVersion:2,ArtifactType:'container_image',Metadata:{ImageID:imageID,OS:{Family:'debian',Name:'forky/sid'}},Results:[{Target:'os',Class:'os-pkgs',Type:'debian',Packages:[{Name:'libc6',Epoch:1,Version:'2.44',Release:'1ubuntu2'}]},{Target:'node',Class:'lang-pkgs',Type:'node-pkg',Packages:[{Name:'example',Version:'1.0.0'}]}]};
  const browser={node:'26.12.1',os:'ubuntu',osVersion:'26.10',uid:1000,gid:1000,playwright:'1.64.1',requests:0,browserErrors:0,trustedInlineFixtureOnly:true,chromiumSandbox:false,liveProvidersVerified:false,untrustedProviderSafetyVerified:false,glibc:'2.44',browserVersion:'156.0.8078.4',browserRevision:'1248',adapterSha256:'a'.repeat(64),results:[{viewport:{width:1440,height:960},javascriptAndDom:true},{viewport:{width:390,height:844},javascriptAndDom:true}]};
  const input={sbom,scan,feed,trivy,browser,dependencies:{example:'1.0.0'},imageID,now};
  assert.equal(verifyUbuntuImageSecurity(input).passed,true);
  assert.equal(canonicalDpkgVersion({Epoch:1,Version:'2.44',Release:'1ubuntu2'}),'1:2.44-1ubuntu2');
  assert.throws(()=>canonicalDpkgVersion({Epoch:1,Version:'1:2.44'}),/INCONSISTENT_DPKG_VERSION/);
  assert.throws(()=>verifyUbuntuImageSecurity({...input,imageID:'sha256:'+'b'.repeat(64)}),/MIXED_IMAGE_EVIDENCE/);
  const changed=structuredClone(trivy); changed.Results[0].Packages[0].Release='wrong';
  assert.throws(()=>verifyUbuntuImageSecurity({...input,trivy:changed}),/INCONSISTENT_OS_PACKAGE_INVENTORIES/);
  const vulnerable=structuredClone(trivy); vulnerable.Results[1].Vulnerabilities=[{VulnerabilityID:'fixture'}];
  assert.throws(()=>verifyUbuntuImageSecurity({...input,trivy:vulnerable}),/SECONDARY_FINDINGS_PRESENT/);
  assert.throws(()=>verifyUbuntuImageSecurity({...input,scan:{...scan,matches:[{artifact:{id:'npm'}}]}}),/VULNERABILITIES_PRESENT/);
  assert.throws(()=>verifyUbuntuImageSecurity({...input,scan:{...scan,ignoredMatches:[{artifact:{id:'npm'}}]}}),/IGNORED_FINDINGS_PRESENT/);
  const mixed=structuredClone(scan); mixed.source.target.imageID='sha256:'+'c'.repeat(64);
  assert.throws(()=>verifyUbuntuImageSecurity({...input,scan:mixed}),/MIXED_SCANNER_IMAGE/);
  const tampered=structuredClone(sbom); tampered.source.metadata.config=Buffer.from('{}').toString('base64');
  assert.throws(()=>verifyUbuntuImageSecurity({...input,sbom:tampered}),/IMAGE_CONFIG_HASH_MISMATCH/);
  assert.throws(()=>resolvePrivateComponent({type:'npm',name:'arbitrary',version:'UNKNOWN'},sbom,{}),/UNRESOLVED_PACKAGE_VERSION/);
  const parent='/app/node_modules/chart.js/';
  const child={type:'npm',name:'chart.js-auto',version:'UNKNOWN',metadata:{private:true,version:''},locations:[{path:parent+'auto/package.json'}]};
  assert.throws(()=>resolvePrivateComponent({...child,name:'constructor'},sbom,{'chart.js':'4.6.1'}),/UNRESOLVED_PACKAGE_VERSION/);
  const owner={type:'npm',name:'chart.js',version:'4.6.1',locations:[{path:parent+'package.json'}]};
  const owned={artifacts:[owner,child],files:[{location:{path:parent+'package.json'},digests:[{algorithm:'sha256',value:'8d4f31d8cd8330b0c3c5cbaed85f9bebb77311197ca545b6584a631ff4adfb1c'}]},{location:{path:parent+'auto/package.json'},digests:[{algorithm:'sha256',value:'4af5ef359241dfddd617e93eb9e3f5618dfbd8320e094e1409b92b197f0bb268'}]}]};
  assert.equal(resolvePrivateComponent(child,owned,{'chart.js':'4.6.1'}).owners[0].version,'4.6.1');
  const badOwned=structuredClone(owned); badOwned.files[1].digests[0].value='b'.repeat(64);
  assert.throws(()=>resolvePrivateComponent(child,badOwned,{'chart.js':'4.6.1'}),/UNVERIFIED_PRIVATE_COMPONENT_MANIFEST/);
  assert.throws(()=>resolvePrivateComponent(child,{...owned,artifacts:[child]},{'chart.js':'4.6.1'}),/MISSING_VERSIONED_COMPONENT_OWNER/);
});
