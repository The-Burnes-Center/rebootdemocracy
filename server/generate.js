// server/generate.js
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const outputDir = path.resolve('.output/public');
const cacheDir = path.resolve('.cache/output-public');
const tempRestoreDir = path.resolve('.cache/temp-output');

async function run() {
  console.log('[Build] Starting generate with cache optimization...');

  if (await fs.pathExists(cacheDir)) {
    await fs.copy(cacheDir, tempRestoreDir);
    console.log('[Cache] Restored from previous output.');
  }

  if (await fs.pathExists(tempRestoreDir)) {
    await fs.copy(tempRestoreDir, outputDir, { overwrite: false });
    await fs.remove(tempRestoreDir);
    console.log('[Cache] Merged with existing output.');
  }

  execSync('npx nuxi generate', { stdio: 'inherit' });

  await fs.copy(outputDir, cacheDir);
  console.log('[Cache] Saved new output to cache.');
}

run().catch((err) => {
  console.error('[Error] Failed during generate pipeline:', err);
  process.exit(1);
});
