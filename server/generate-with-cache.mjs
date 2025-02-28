import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';

const cacheDir = path.resolve('.cache/dist');
const distDir = path.resolve('dist');
const tempRestoreDir = path.resolve('.cache/temp-dist');

async function restoreCacheToTemp() {
  if (await fs.pathExists(cacheDir)) {
    console.log('Restoring cached dist folder to temporary location...');
    await fs.copy(cacheDir, tempRestoreDir);
  } else {
    console.log('No cached dist folder found.');
  }
}

async function mergeCachedFiles() {
  if (await fs.pathExists(tempRestoreDir)) {
    console.log('Merging cached files back into dist folder...');
    await fs.copy(tempRestoreDir, distDir, { overwrite: false });
    await fs.remove(tempRestoreDir);
  } else {
    console.log('No temporary cached files to merge.');
  }
}

async function saveCache() {
  console.log('Saving dist folder to cache...');
  await fs.copy(distDir, cacheDir);
}

async function generate() {
  try {
    await restoreCacheToTemp(); // Restore cache to temp location
    execSync('nuxt generate', { stdio: 'inherit' }); // Nuxt clears dist and generates new files
    await mergeCachedFiles(); // Merge cached files back into dist without overwriting new files
    await saveCache(); // Save updated dist folder back to cache
  } catch (error) {
    console.error('Error during generate:', error);
    process.exit(1);
  }
}

generate();