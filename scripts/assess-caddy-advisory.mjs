// Assess one advisory's package applicability, never whole-image acceptance.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const affectedPaths=['golang.org/x/crypto/openpgp','golang.org/x/crypto/openpgp/packet','golang.org/x/crypto/openpgp/armor','golang.org/x/crypto/openpgp/clearsign','golang.org/x/crypto/openpgp/errors','golang.org/x/crypto/openpgp/elgamal','golang.org/x/crypto/openpgp/s2k'];
const hash=text=>createHash('sha256').update(text,'utf8').digest('hex');
const sourceSha='bb250cdef3e4baad82af6c048ac9754b4d1350d50a55af7c34e8d1aa574a6211';
function binaryHash(line,path) {
  const match=line.trim().match(/^([a-f0-9]{64})\s+(\S+)$/);
  assert.ok(match && match[2]===path,'INVALID_BINARY_HASH_RECORD'); return match[1];
}
export function assessCaddyAdvisory({advisory,scan,linkedPackages,buildInfo,environmentText,buildHash,runtimeHash,manifest,version}) {
  const environment=JSON.parse(environmentText);
  assert.equal(advisory?.id,'GO-2026-5932','WRONG_ADVISORY');
  assert.equal(advisory.affected?.length,1,'CHANGED_ADVISORY_SCOPE');
  const scope=advisory.affected[0];
  assert.deepEqual(scope.package,{name:'golang.org/x/crypto',ecosystem:'Go'},'CHANGED_ADVISORY_SCOPE');
  assert.deepEqual(scope.ecosystem_specific?.imports?.map(item=>item.path).sort(),[...affectedPaths].sort(),'CHANGED_ADVISORY_SCOPE');
  assert.deepEqual(environment,{CGO_ENABLED:'0',GOARCH:environment.GOARCH,GOOS:'linux',GOVERSION:'go1.27.3'},'WRONG_BUILD_ENVIRONMENT');
  assert.ok(['amd64','arm64'].includes(environment.GOARCH),'UNQUALIFIED_ARCHITECTURE');
  assert.match(version,/^v2[.]11[.]7-cofounder[.]20261023[.]2(?:\s|$)/,'WRONG_CADDY_VERSION');
  assert.match(buildInfo,/^\/out\/caddy: go1[.]27[.]3(?:\r?\n|$)/,'WRONG_BINARY_TOOLCHAIN');
  assert.match(buildInfo,/\n\s*path\s+github[.]com\/caddyserver\/caddy\/v2\/cmd\/caddy\s*\n/,'WRONG_BINARY_PACKAGE');
  assert.match(buildInfo,/\n\s*dep\s+golang[.]org\/x\/crypto\s+v0[.]58[.]0\s/,'WRONG_LINKED_MODULE');
  for (const field of ['CGO_ENABLED=0','GOOS=linux','GOARCH='+environment.GOARCH,'-trimpath=true']) assert.ok(buildInfo.includes('\tbuild\t'+field),'UNMATCHED_BUILD_ENVIRONMENT');
  const runtime=binaryHash(runtimeHash,'/usr/bin/caddy');
  assert.equal(binaryHash(buildHash,'/out/caddy'),runtime,'BUILD_RUNTIME_HASH_MISMATCH');
  for (const [key,value] of Object.entries({binarySha256:runtime,linkedPackagesSha256:hash(linkedPackages),buildInfoSha256:hash(buildInfo),buildEnvironmentSha256:hash(environmentText)})) {
    assert.equal(manifest[key],value,'BUILD_MANIFEST_MISMATCH:'+key);
  }
  assert.equal(manifest.sourceSha256,sourceSha,'WRONG_SOURCE_ARCHIVE');
  assert.equal(manifest.package,'./cmd/caddy','WRONG_BUILD_PACKAGE');
  assert.equal(manifest.trimpath,true,'WRONG_BUILD_PROFILE');
  const packages=linkedPackages.trimEnd().split(/\r?\n/);
  assert.ok(packages.length>=1000 && packages.every(path=>path.length>0 && !/\s/.test(path)) && new Set(packages).size===packages.length,'INCOMPLETE_COMPILE_GRAPH');
  assert.ok(packages.includes('github.com/caddyserver/caddy/v2/cmd/caddy') && packages.some(path=>path.startsWith('golang.org/x/crypto/')),'INCOMPLETE_COMPILE_GRAPH');
  const included=packages.filter(path=>affectedPaths.some(affected=>path===affected || path.startsWith(affected+'/')));
  assert.deepEqual(included,[],'VULNERABLE_PACKAGE_INCLUDED');
  assert.equal(scan?.SchemaVersion,2,'INVALID_EDGE_SCAN'); assert.equal(scan.ArtifactType,'container_image','INVALID_EDGE_SCAN');
  assert.equal(scan.Metadata?.OS?.Family,'alpine','WRONG_EDGE_OS'); assert.equal(scan.Metadata.OS.Name,'3.24.3','WRONG_EDGE_OS');
  assert.ok(Array.isArray(scan.Results) && scan.Results.length>0,'MISSING_EDGE_INVENTORY');
  let osPackages=0,goPackages=0,advisoryFindings=0,otherFindings=0;
  for (const result of scan.Results) {
    assert.ok(Array.isArray(result.Packages) && result.Packages.length>0,'MISSING_EDGE_INVENTORY');
    if (result.Class==='os-pkgs' && result.Type==='alpine') osPackages+=result.Packages.length;
    const caddy=result.Class==='lang-pkgs' && result.Type==='gobinary' && result.Target.replace(/^\//,'')==='usr/bin/caddy';
    if(caddy) {goPackages+=result.Packages.length; assert.ok(result.Packages.some(pkg=>pkg.Name==='golang.org/x/crypto' && pkg.Version==='v0.58.0'),'MISSING_LINKED_MODULE_INVENTORY');}
    if(Object.hasOwn(result,'ExperimentalModifiedFindings')) assert.ok(Array.isArray(result.ExperimentalModifiedFindings) && result.ExperimentalModifiedFindings.length===0,'MODIFIED_FINDINGS_PRESENT');
    if(Object.hasOwn(result,'Vulnerabilities')) assert.ok(Array.isArray(result.Vulnerabilities),'INVALID_FINDINGS');
    for (const finding of result.Vulnerabilities??[]) {
      if(finding.VulnerabilityID==='GO-2026-5932') {assert.ok(caddy && finding.PkgName==='golang.org/x/crypto' && finding.InstalledVersion==='v0.58.0','UNMATCHED_ADVISORY_FINDING'); advisoryFindings++;}
      else otherFindings++;
    }
  }
  assert.ok(osPackages>0 && goPackages>0,'MISSING_EDGE_INVENTORY');
  return {advisory:'GO-2026-5932',decision:'not_affected',justification:'vulnerable_code_not_present',source:'https://vuln.go.dev/ID/GO-2026-5932.json',binarySha256:runtime,linkedPackagesSha256:hash(linkedPackages),compiledPackages:packages.length,affectedPackagesIncluded:included,rawAdvisoryFindingsRetained:advisoryFindings,otherFindings,osPackages,goPackages,wholeImageSecurityAcceptance:false,scope:'package applicability for the recorded Caddy binary only; existing raw scan gate remains required'};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const read=name=>readFileSync(new URL('../output/'+name,import.meta.url),'utf8');
  const manifest=JSON.parse(read('caddy-build-evidence.json'));
  const envText=read('caddy-build-environment.json');
  assert.equal(manifest.buildEnvironmentSha256,hash(envText),'BUILD_MANIFEST_MISMATCH:environment');
  const result=assessCaddyAdvisory({advisory:JSON.parse(read('caddy-go-advisory.json')),scan:JSON.parse(read('image-security-edge.json')),linkedPackages:read('caddy-linked-packages.txt'),buildInfo:read('caddy-build-info.txt'),environmentText:envText,buildHash:read('caddy-binary-sha256.txt'),runtimeHash:read('caddy-runtime-sha256.txt'),manifest,version:read('caddy-version.txt')});
  console.log(JSON.stringify(result));
}
