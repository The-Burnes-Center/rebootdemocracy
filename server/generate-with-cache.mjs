import fs from 'fs-extra';
import { execSync } from 'child_process';
import path from 'path';

const cacheDir = path.resolve('.cache/dist');
const distDir = path.resolve('dist');

async function restoreCache() {
  if (await fs.pathExists(cacheDir)) {
    console.log('Restoring cached dist folder...');
    await fs.copy(cacheDir, distDir);
  } else {
    console.log('No cached dist folder found.');
  }
}

async function saveCache() {
  console.log('Saving dist folder to cache...');
  await fs.copy(distDir, cacheDir);
}

async function generate() {
  try {
    await restoreCache();
    execSync('nuxt generate', { stdio: 'inherit' });
    await saveCache();
  } catch (error) {
    console.error('Error during generate:', error);
    process.exit(1);
  }
}

generate();