// Generates an ignored local Wrangler config for Cloudflare Workers Builds.
// Only the D1 database UUID is read from build configuration; never secrets.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const databaseId = (process.env.PS_D1_DATABASE_ID || '').trim();
if (!/^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/.test(databaseId)) {
  console.error('Missing/invalid PS_D1_DATABASE_ID. Set this build-time variable to the UUID shown under Cloudflare D1 → ps-build-studio-db.');
  process.exitCode = 1;
} else {
  const dir = dirname(fileURLToPath(import.meta.url));
  const config = [
    'name = "ps-build-studio-cloud"',
    'main = "index.js"',
    'compatibility_date = "2026-10-20"',
    'workers_dev = true',
    '',
    '[[d1_databases]]',
    'binding = "DB"',
    'database_name = "ps-build-studio-db"',
    `database_id = "${databaseId}"`,
    'migrations_dir = "migrations"',
    '',
  ].join('\n');
  writeFileSync(join(dir, '..', 'wrangler.toml'), config, { mode: 0o600 });
  console.log('Wrangler config created for ps-build-studio-cloud; database binding DB configured. No secret values were written.');
}
