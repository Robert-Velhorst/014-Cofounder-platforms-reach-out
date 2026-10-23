import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length && args[0] !== '--database')) throw new Error('Supported invocation: stable-runtime.mjs [--database]');
if (process.versions.node !== '26.12.1') throw new Error('Node 26.12.1 required.');
const result = { node: process.versions.node, openssl: process.versions.openssl, platform: process.platform, liveProvidersVerified: false };
if (args.length) {
  const target = new URL(process.env.DATABASE_URL);
  if (target.protocol !== 'mysql:' || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.pathname !== '/cofounder_test' || target.search || target.hash) throw new Error('Disposable loopback cofounder_test database required.');
  const require = createRequire(new URL('../apps/cofounder-discovery/package.json', import.meta.url));
  const connection = await require('mysql2/promise').createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.query('SELECT VERSION() AS version');
    result.mysql = rows[0].version;
    if (!/^26\.10\.0(?:$|[-.])/.test(result.mysql)) throw new Error('MySQL 26.10.0 required.');
  } finally { await connection.end(); }
}
await mkdir('output', { recursive: true });
await writeFile('output/stable-runtime-verification.json', JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify(result));
