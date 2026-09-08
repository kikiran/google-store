/**
 * Static verification: parses every backend .js file with `node --check`
 * and reports any syntax errors. Also verifies the shared package loads.
 *
 * Usage: npm run check
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanDirs = ['services', 'shared', 'infrastructure/scripts'];

const files = [];
for (const dir of scanDirs) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
        files.push(full);
      }
    }
  };
  walk(abs);
}

let failed = 0;
for (const file of files.sort()) {
  try {
    // --check refuses to run under ESM import.meta usage? No — it only parses.
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failed += 1;
    const msg = err.stderr?.toString() || err.message;
    console.error(`FAIL ${path.relative(root, file)}\n${msg.split('\n').slice(0, 6).join('\n')}`);
  }
}

// Ensure the shared package resolves & exports cleanly in this environment.
let sharedOk = true;
try {
  const mod = await import('@nova/shared');
  const required = ['config', 'db', 'middleware', 'utils', 'ApiError', 'success', 'asyncHandler', 'logger', 'jwt', 'crypto'];
  for (const key of required) {
    if (!(key in mod)) {
      console.error(`shared missing export: ${key}`);
      sharedOk = false;
    }
  }
} catch (err) {
  sharedOk = false;
  console.error('shared import failed:', err.message);
}

console.log(`\nParsed ${files.length} backend files — ${files.length - failed} OK, ${failed} FAILED`);
console.log(`shared package: ${sharedOk ? 'OK' : 'FAILED'}`);
process.exit(failed === 0 && sharedOk ? 0 : 1);