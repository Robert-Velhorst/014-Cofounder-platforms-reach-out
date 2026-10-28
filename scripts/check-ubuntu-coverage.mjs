// Candidate scanner capability only. This is not a vulnerability acceptance gate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateUbuntuCoverage(scan, feed) {
  assert.equal(scan?.distro?.name?.toLowerCase(),'ubuntu','WRONG_SCANNER_DISTRO');
  assert.equal(scan.distro.version,'26.10','WRONG_SCANNER_RELEASE');
  assert.ok(Array.isArray(scan.matches),'MISSING_CANDIDATE_REPORT');
  assert.ok(scan.descriptor?.db && typeof scan.descriptor.db==='object','MISSING_DATABASE_METADATA');
  assert.ok(Array.isArray(feed) && feed.length>0,'MISSING_UBUNTU_FEED_ROWS');
  const rows=feed.filter(row=>row?.vulnerability?.provider==='ubuntu' && row.vulnerability.status==='active' && typeof row.vulnerability.id==='string' && row.vulnerability.id.length && row.packages?.some(pkg=>pkg.os?.name?.toLowerCase()==='ubuntu' && pkg.os.version==='26.10' && typeof pkg.package?.name==='string' && pkg.package.name.length));
  assert.ok(rows.length>0,'NO_ACTIVE_UBUNTU_2610_FEED_ROWS');
  return {ubuntuFeedCoverage:true,release:'26.10',activeFeedRows:rows.length,baseImageMatches:scan.matches.length,securityAcceptance:false,scope:'public base image and vendor-feed coverage probe only'};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,2,'UNEXPECTED_ARGUMENTS');
  const scan=JSON.parse(readFileSync(new URL('../output/ubuntu-grype-coverage.json',import.meta.url),'utf8'));
  const feed=JSON.parse(readFileSync(new URL('../output/ubuntu-grype-feed.json',import.meta.url),'utf8'));
  const result=validateUbuntuCoverage(scan,feed);
  console.log(JSON.stringify(result));
}
