// Native package policy, with one evidence-backed package-absence assessment.
// Every raw finding remains in its original report. No generic ignore rules.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessCaddyAdvisory } from './assess-caddy-advisory.mjs';
import { validateCaddyRootReceipt } from './check-caddy-root-advisories.mjs';

export function verifyNativePackageSecurity({caddy,database,edgeImageID,databaseImageID,mysqlVersion,rootReceipt,now=Date.now()}) {
  for(const id of [edgeImageID,databaseImageID]) assert.match(id,/^sha256:[a-f0-9]{64}$/,'INVALID_NATIVE_IMAGE_ID');
  assert.equal(caddy.scan?.Metadata?.ImageID,edgeImageID,'MIXED_EDGE_IMAGE');
  const assessment=assessCaddyAdvisory(caddy);
  assert.equal(assessment.decision,'not_affected','UNRESOLVED_NATIVE_ADVISORY');
  assert.equal(assessment.otherFindings,0,'APPLICABLE_EDGE_FINDINGS');
  if(Object.hasOwn(caddy.scan.Metadata.OS,'EOSL')) assert.equal(caddy.scan.Metadata.OS.EOSL,false,'EOL_EDGE_OS');
  const rootQuery=validateCaddyRootReceipt(rootReceipt,now);
  assert.equal(database?.SchemaVersion,2,'INVALID_DATABASE_SCAN');
  assert.equal(database.ArtifactType,'container_image','INVALID_DATABASE_SCAN');
  assert.equal(database.Metadata?.ImageID,databaseImageID,'MIXED_DATABASE_IMAGE');
  assert.equal(database.Metadata.OS?.Family,'oracle','UNQUALIFIED_DATABASE_OS');
  assert.equal(database.Metadata.OS.Name,'9.8','UNQUALIFIED_DATABASE_OS');
  if(Object.hasOwn(database.Metadata.OS,'EOSL')) assert.equal(database.Metadata.OS.EOSL,false,'EOL_DATABASE_OS');
  assert.match(mysqlVersion,/^\/usr\/sbin\/mysqld\s+Ver 26[.]10[.]0 for Linux\s/,'WRONG_DATABASE_EXECUTABLE');
  assert.ok(Array.isArray(database.Results) && database.Results.length>0,'MISSING_DATABASE_INVENTORY');
  let packages=0,osPackages=0;
  for(const result of database.Results) {
    assert.ok(typeof result.Target==='string' && result.Target.length && ['os-pkgs','lang-pkgs'].includes(result.Class) && Array.isArray(result.Packages) && result.Packages.length>0,'MISSING_DATABASE_INVENTORY');
    for(const field of ['Vulnerabilities','ExperimentalModifiedFindings']) if(Object.hasOwn(result,field)) assert.ok(Array.isArray(result[field]) && result[field].length===0,'DATABASE_FINDINGS_PRESENT:'+field);
    if(result.Class==='os-pkgs') {assert.equal(result.Type,'oracle','INVALID_DATABASE_INVENTORY'); osPackages+=result.Packages.length;}
    for(const pkg of result.Packages) {assert.ok(typeof pkg.Name==='string' && pkg.Name.length && typeof pkg.Version==='string' && pkg.Version.length,'INVALID_DATABASE_PACKAGE'); packages++;}
  }
  assert.ok(osPackages>0,'MISSING_DATABASE_OS_INVENTORY');
  return {passed:true,scope:'recorded edge/database OS and Go package vulnerability policy only',edgeImageID,databaseImageID,rawFindingsRetained:assessment.rawAdvisoryFindingsRetained,notAffectedFindings:assessment.rawAdvisoryFindingsRetained,applicableFindings:0,databasePackages:packages,databaseOsPackages:osPackages,caddyAssessment:assessment,caddyRootQuery:rootQuery,wholeImageSecurityAcceptance:false,deploymentAcceptance:false};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const read=name=>readFileSync(new URL('../output/'+name,import.meta.url),'utf8');
  const json=name=>JSON.parse(read(name));
  const caddy={advisory:json('caddy-go-advisory.json'),scan:json('image-security-edge.json'),linkedPackages:read('caddy-linked-packages.txt'),buildInfo:read('caddy-build-info.txt'),environmentText:read('caddy-build-environment.json'),buildHash:read('caddy-binary-sha256.txt'),runtimeHash:read('caddy-runtime-sha256.txt'),manifest:json('caddy-build-evidence.json'),version:read('caddy-version.txt')};
  console.log(JSON.stringify(verifyNativePackageSecurity({caddy,database:json('image-security-database.json'),edgeImageID:read('caddy-image-id.txt').trim(),databaseImageID:read('mysql-image-id.txt').trim(),mysqlVersion:read('mysql-version.txt'),rootReceipt:json('caddy-root-advisories.json')})));
}
