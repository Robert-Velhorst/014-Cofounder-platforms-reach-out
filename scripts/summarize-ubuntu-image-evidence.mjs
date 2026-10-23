// Validate evidence completeness. Findings are retained; this is not acceptance.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateUbuntuCoverage } from './check-ubuntu-coverage.mjs';

export function summarizeUbuntuImageEvidence(sbom, scan, feed, dependencies, now=Date.now()) {
  validateUbuntuCoverage(scan,feed);
  assert.equal(sbom?.descriptor?.name,'syft','MISSING_SBOM_TOOL');
  assert.equal(sbom.descriptor.version,'1.55.0','WRONG_SBOM_VERSION');
  assert.equal(sbom.distro?.name?.toLowerCase(),'ubuntu','WRONG_SBOM_DISTRO');
  assert.equal(sbom.distro.id,'ubuntu','WRONG_SBOM_DISTRO_ID');
  assert.equal(sbom.distro.versionID,'26.10','WRONG_SBOM_RELEASE');
  assert.ok(Array.isArray(sbom.artifacts) && sbom.artifacts.length>0,'MISSING_SBOM_INVENTORY');
  const ids=new Set(), nodePackages=new Set(); let osPackages=0;
  for (const pkg of sbom.artifacts) {
    for (const key of ['id','name','version','type']) assert.ok(typeof pkg[key]==='string' && pkg[key].length,'INVALID_SBOM_PACKAGE');
    assert.ok(!ids.has(pkg.id),'DUPLICATE_SBOM_PACKAGE_ID'); ids.add(pkg.id);
    if (pkg.type==='deb') osPackages++;
    if (pkg.type==='npm') nodePackages.add(`${pkg.name}@${pkg.version}`);
    assert.ok(pkg.name!=='typescript' && !pkg.name.startsWith('@typescript/'),'BUILD_COMPILER_IN_RUNTIME');
  }
  assert.ok(osPackages>0 && sbom.artifacts.some(pkg=>pkg.type==='deb' && pkg.name==='libc6'),'MISSING_OS_INVENTORY');
  for (const [name,version] of Object.entries(dependencies)) assert.ok(nodePackages.has(`${name}@${version}`),'MISSING_RUNTIME_DEPENDENCY:'+name);
  const db=scan.descriptor.db.status;
  assert.equal(db?.valid,true,'INVALID_VULNERABILITY_DATABASE');
  const age=now-Date.parse(db.built);
  assert.ok(Number.isFinite(age) && age>=-3600000 && age<=5*86400000,'STALE_VULNERABILITY_DATABASE');
  assert.ok(scan.descriptor.db.providers?.ubuntu,'MISSING_UBUNTU_PROVIDER');
  const config=scan.descriptor.configuration;
  assert.ok(config && typeof config==='object','MISSING_SCANNER_CONFIGURATION');
  for (const key of ['show-suppressed','include-matcher-suppressions','match-upstream-kernel-headers']) assert.equal(config[key],true,'INCOMPLETE_SCANNER_CONFIGURATION:'+key);
  for (const key of ['only-fixed','only-notfixed']) assert.equal(config[key],false,'FILTERED_SCANNER_CONFIGURATION:'+key);
  assert.equal(config['ignore-wontfix'],'','FILTERED_FIX_STATES');
  for (const key of ['ignore','exclude','vex-documents','vex-add']) assert.deepEqual(config[key],[],'FILTERED_SCANNER_CONFIGURATION:'+key);
  // The pinned JSON presenter omits this optional field when no ignored rows exist.
  if (Object.hasOwn(scan,'ignoredMatches')) assert.ok(Array.isArray(scan.ignoredMatches),'INVALID_IGNORED_FINDINGS');
  const ignored=scan.ignoredMatches??[];
  for (const match of [...scan.matches,...ignored]) assert.ok(ids.has(match.artifact?.id),'FINDING_OUTSIDE_SBOM');
  return {evidenceComplete:true,securityAcceptance:false,os:'ubuntu',release:'26.10',packages:ids.size,osPackages,nodePackages:nodePackages.size,directDependenciesVerified:Object.keys(dependencies).length,findings:scan.matches.length,ignoredFindings:ignored.length,databaseBuilt:db.built,scope:'full captured application SBOM and scanner reports; existing strict security gate remains required'};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const read=name=>JSON.parse(readFileSync(new URL('../output/'+name,import.meta.url),'utf8'));
  const manifest=JSON.parse(readFileSync(new URL('../apps/cofounder-discovery/package.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(summarizeUbuntuImageEvidence(read('ubuntu-app-sbom.json'),read('ubuntu-app-grype.json'),read('ubuntu-app-feed.json'),manifest.dependencies)));
}
