import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { hooks } from '../.pnpmfile.mjs';
import { validateImageReport } from './check-image-security.mjs';
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
  const report = { SchemaVersion: 2, ArtifactType: 'container_image', Metadata: { OS: { Family: 'debian', Name: '13', EOSL: false } }, Results: [
    { Target: 'debian', Class: 'os-pkgs', Type: 'debian', Packages: [{ Name: 'libc6', Version: '2.41' }] },
    { Target: 'node', Class: 'lang-pkgs', Type: 'node-pkg', Packages: [{ Name: 'example', Version: '1.0.0' }] },
  ] };
  assert.equal(validateImageReport(report, {example:'1.0.0'}).passed,true);
  assert.throws(()=>validateImageReport(report,{missing:'1.0.0'}),/MISSING_RUNTIME_DEPENDENCY/);
  assert.throws(()=>validateImageReport({...report,Results:report.Results.slice(1)},{}),/MISSING_OS_INVENTORY/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[0],Vulnerabilities:[{}]}]},{}),/VULNERABILITIES_PRESENT/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[0],ExperimentalModifiedFindings:[{}]}]},{}),/SUPPRESSED_FINDINGS/);
  assert.throws(()=>validateImageReport({...report,Results:[{...report.Results[1],Packages:[{Name:'typescript',Version:'7.0.2'}]}]},{}),/BUILD_COMPILER_IN_RUNTIME/);
});
