// OS/Node package policy only: no deployment, browser-exploit or provider acceptance.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeUbuntuImageEvidence } from './summarize-ubuntu-image-evidence.mjs';
import { validateInstalledBrowserReport } from './check-installed-browser-report.mjs';

const sha256=value=>createHash('sha256').update(value).digest('hex');
const nonempty=value=>typeof value==='string' && value.trim().length>0;
const digest=value=>typeof value==='string' && /^sha256:[a-f0-9]{64}$/.test(value);
const componentHashes={
  'package.json':'8d4f31d8cd8330b0c3c5cbaed85f9bebb77311197ca545b6584a631ff4adfb1c',
  'auto/package.json':'4af5ef359241dfddd617e93eb9e3f5618dfbd8320e094e1409b92b197f0bb268',
  'helpers/package.json':'0c2dbe093a9845f93a1485a8feb17e1c6118fc22080915d339437c129ff38e72',
};
// These manifests were independently matched to the integrity-verified official
// chart.js 4.6.1 npm archive. The two private subpackages have no own version;
// they belong to the versioned parent, which must also be scanned and installed.
export function resolvePrivateComponent(pkg,sbom,dependencies) {
  const sub=new Map([['chart.js-auto','auto'],['chart.js-helpers','helpers']]).get(pkg.name);
  assert.ok(typeof sub==='string' && pkg.type==='npm' && pkg.version==='UNKNOWN' && pkg.metadata?.private===true && pkg.metadata.version==='' && Object.hasOwn(dependencies,'chart.js') && dependencies['chart.js']==='4.6.1','UNRESOLVED_PACKAGE_VERSION');
  assert.ok(Array.isArray(pkg.locations) && pkg.locations.length>0,'MISSING_PRIVATE_COMPONENT_LOCATION');
  const owners=[];
  for (const location of pkg.locations) {
    assert.ok(nonempty(location.path) && location.path.endsWith('/'+sub+'/package.json'),'INVALID_PRIVATE_COMPONENT_LOCATION');
    const parent=location.path.slice(0,-(sub+'/package.json').length);
    assert.ok(parent.startsWith('/app/node_modules/') && !parent.includes('/../'),'INVALID_PRIVATE_COMPONENT_LOCATION');
    assert.ok(sbom.artifacts.some(p=>p.type==='npm' && p.name==='chart.js' && p.version==='4.6.1' && p.locations?.some(l=>l.path===parent+'package.json')),'MISSING_VERSIONED_COMPONENT_OWNER');
    for (const file of ['package.json',sub+'/package.json']) {
      assert.ok(Object.hasOwn(componentHashes,file),'UNREVIEWED_PRIVATE_COMPONENT_MANIFEST');
      const records=(sbom.files??[]).filter(f=>f.location?.path===parent+file);
      assert.ok(records.length===1 && records[0].digests?.some(d=>d.algorithm==='sha256' && d.value===componentHashes[file]),'UNVERIFIED_PRIVATE_COMPONENT_MANIFEST');
    }
    owners.push({parent:'chart.js',version:'4.6.1',manifest:parent+'package.json',childManifest:location.path});
  }
  return {name:pkg.name,rawVersion:pkg.version,classification:'private subpackage owned by versioned parent',owners,source:'https://registry.npmjs.org/chart.js/4.6.1'};
}
export function canonicalDpkgVersion(pkg) {
  assert.ok(nonempty(pkg.Version),'INVALID_DPKG_VERSION');
  assert.ok(pkg.Epoch===undefined || (Number.isInteger(pkg.Epoch) && pkg.Epoch>=0),'INVALID_DPKG_EPOCH');
  assert.ok(pkg.Release===undefined || typeof pkg.Release==='string','INVALID_DPKG_RELEASE');
  assert.ok(!pkg.Epoch || !pkg.Version.includes(':'),'INCONSISTENT_DPKG_VERSION');
  return (pkg.Epoch?pkg.Epoch+':':'')+pkg.Version+(pkg.Release?'-'+pkg.Release:'');
}
export function verifyUbuntuImageSecurity({sbom,scan,feed,trivy,browser,dependencies,imageID,now=Date.now()}) {
  const inventory=summarizeUbuntuImageEvidence(sbom,scan,feed,dependencies,now);
  validateInstalledBrowserReport(browser);
  assert.equal(scan.descriptor.name,'grype','WRONG_VULNERABILITY_SCANNER');
  assert.equal(scan.descriptor.version,'0.121.0','WRONG_VULNERABILITY_SCANNER_VERSION');
  assert.equal(inventory.findings,0,'VULNERABILITIES_PRESENT'); assert.equal(inventory.ignoredFindings,0,'IGNORED_FINDINGS_PRESENT');
  if(Object.hasOwn(scan,'alertsByPackage')) assert.deepEqual(scan.alertsByPackage,{},'SCANNER_ALERTS_PRESENT');
  const config=sbom.descriptor.configuration;
  assert.equal(config?.search?.scope,'squashed','WRONG_SBOM_SCOPE');
  for(const cataloger of ['dpkg-db-cataloger','javascript-package-cataloger','binary-classifier-cataloger']) assert.ok(config.catalogers?.used?.includes(cataloger),'MISSING_REQUIRED_CATALOGER');
  assert.equal(sbom.source?.type,'image','WRONG_SBOM_SOURCE');
  assert.ok(digest(imageID),'INVALID_RUNTIME_IMAGE_ID');
  const source=sbom.source.metadata;
  assert.equal(source.imageID,imageID,'MIXED_IMAGE_EVIDENCE');
  assert.equal(scan.source?.type,'image','WRONG_SCANNER_SOURCE');
  assert.equal(scan.source.target.imageID,imageID,'MIXED_SCANNER_IMAGE');
  assert.ok(digest(source.manifestDigest),'MISSING_IMAGE_MANIFEST');
  assert.equal(scan.source.target.manifestDigest,source.manifestDigest,'MIXED_SCANNER_MANIFEST');
  const manifest=Buffer.from(source.manifest,'base64'), imageConfig=Buffer.from(source.config,'base64');
  assert.equal('sha256:'+sha256(manifest),source.manifestDigest,'IMAGE_MANIFEST_HASH_MISMATCH');
  assert.equal('sha256:'+sha256(imageConfig),imageID,'IMAGE_CONFIG_HASH_MISMATCH');
  const manifestObject=JSON.parse(manifest.toString('utf8'));
  assert.equal(manifestObject.config?.digest,imageID,'MIXED_IMAGE_CONFIG');
  const metadata=JSON.parse(imageConfig.toString('utf8'));
  assert.equal(metadata.os,'linux','WRONG_IMAGE_OS');
  assert.ok(['amd64','arm64'].includes(metadata.architecture),'UNQUALIFIED_IMAGE_ARCHITECTURE');
  const privateComponents=[];
  const osPackages=new Set(),nodePackages=new Set();
  for(const pkg of sbom.artifacts) {
    assert.ok(['deb','npm','binary'].includes(pkg.type),'UNQUALIFIED_PACKAGE_ECOSYSTEM');
    if(pkg.version.toUpperCase()==='UNKNOWN') privateComponents.push(resolvePrivateComponent(pkg,sbom,dependencies));
    if(pkg.type==='deb') osPackages.add(pkg.name+'@'+pkg.version);
    if(pkg.type==='npm' && pkg.version!=='UNKNOWN') nodePackages.add(pkg.name+'@'+pkg.version);
  }
  assert.ok(sbom.artifacts.some(p=>p.type==='binary' && p.name==='node' && p.version==='26.12.1'),'MISSING_RUNTIME_BINARY_INVENTORY');
  assert.equal(trivy?.SchemaVersion,2,'INVALID_SECONDARY_REPORT'); assert.equal(trivy.ArtifactType,'container_image','INVALID_SECONDARY_REPORT');
  assert.equal(trivy.Metadata?.ImageID,imageID,'MIXED_SECONDARY_IMAGE');
  const os=trivy.Metadata.OS;
  assert.ok((os?.Family==='debian' && os.Name==='forky/sid') || (os?.Family==='ubuntu' && os.Name==='26.10'),'UNREVIEWED_SECONDARY_OS_DETECTION');
  assert.ok(Array.isArray(trivy.Results) && trivy.Results.length>0,'MISSING_SECONDARY_INVENTORY');
  const secondaryOS=new Set(),secondaryNode=new Set(); let secondaryPackages=0;
  for(const result of trivy.Results) {
    assert.ok(nonempty(result.Target) && ['os-pkgs','lang-pkgs'].includes(result.Class) && Array.isArray(result.Packages) && result.Packages.length>0,'MISSING_SECONDARY_INVENTORY');
    for(const field of ['Vulnerabilities','ExperimentalModifiedFindings']) if(Object.hasOwn(result,field)) assert.ok(Array.isArray(result[field]) && result[field].length===0,'SECONDARY_FINDINGS_PRESENT:'+field);
    for(const pkg of result.Packages) {
      assert.ok(nonempty(pkg.Name) && nonempty(pkg.Version),'INVALID_SECONDARY_PACKAGE');
      assert.ok(pkg.Name!=='typescript' && !pkg.Name.startsWith('@typescript/'),'BUILD_COMPILER_IN_RUNTIME');
      secondaryPackages++;
      if(result.Class==='os-pkgs') {assert.equal(result.Type,os.Family,'INVALID_SECONDARY_OS_INVENTORY'); secondaryOS.add(pkg.Name+'@'+canonicalDpkgVersion(pkg));}
      if(result.Class==='lang-pkgs' && result.Type==='node-pkg') secondaryNode.add(pkg.Name+'@'+pkg.Version);
    }
  }
  assert.deepEqual([...secondaryOS].sort(),[...osPackages].sort(),'INCONSISTENT_OS_PACKAGE_INVENTORIES');
  assert.ok(secondaryNode.size>0,'MISSING_SECONDARY_NODE_INVENTORY');
  for(const pkg of secondaryNode) assert.ok(nodePackages.has(pkg),'UNSCANNED_SECONDARY_NODE_PACKAGE:'+pkg);
  for(const [name,version] of Object.entries(dependencies)) assert.ok(secondaryNode.has(name+'@'+version),'MISSING_SECONDARY_DIRECT_DEPENDENCY:'+name);
  return {passed:true,scope:'recorded image OS and Node package vulnerability policy only',imageID,ubuntuRelease:'26.10',packages:inventory.packages,osPackages:osPackages.size,directDependenciesVerified:inventory.directDependenciesVerified,secondaryPackages,secondaryDetectedOS:os,osVulnerabilitySource:'Canonical Ubuntu feed via Grype',privateComponents,findings:0,ignoredFindings:0,databaseBuilt:inventory.databaseBuilt,wholeImageSecurityAcceptance:false,browserVulnerabilityAcceptance:false,untrustedProviderSafetyVerified:false,deploymentAcceptance:false};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const read=name=>readFileSync(new URL('../output/'+name,import.meta.url),'utf8');
  const json=name=>JSON.parse(read(name));
  const dependencies=JSON.parse(readFileSync(new URL('../apps/cofounder-discovery/package.json',import.meta.url),'utf8')).dependencies;
  console.log(JSON.stringify(verifyUbuntuImageSecurity({sbom:json('ubuntu-app-sbom.json'),scan:json('ubuntu-app-grype.json'),feed:json('ubuntu-app-feed.json'),trivy:json('image-security.json'),browser:json('installed-browser-verification.json'),imageID:read('app-image-id.txt').trim(),dependencies})));
}
