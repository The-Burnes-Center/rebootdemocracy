// scripts/partial-build.mjs
// Netlify build script for partial SSG - only rebuilds changed blog routes
import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), '.output', 'public');
const CACHE_DIR = join(process.cwd(), '.netlify', 'cache');
const CACHED_OUTPUT_DIR = join(CACHE_DIR, '.output', 'public');

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

// Step 1: Detect changed blog routes
console.log('🔍 Detecting changed blog routes...');
let isPartialBuild = false;
try {
  // Run TypeScript file to detect changed routes
  // We'll use tsx or ts-node to run it, or compile it first
  const changedRoutesResult = execSync('npx tsx scripts/get-changed-blog-routes.ts', { 
    encoding: 'utf-8',
    cwd: process.cwd() 
  });
  const changedRoutes = JSON.parse(changedRoutesResult.trim());
  
  if (changedRoutes.length > 0) {
    isPartialBuild = true;
    console.log(`✅ Found ${changedRoutes.length} changed blog routes`);
    console.log(`   Routes: ${changedRoutes.slice(0, 5).join(', ')}${changedRoutes.length > 5 ? '...' : ''}`);
  } else {
    console.log('ℹ️  No changed blog routes detected, will do full build');
  }
} catch (error) {
  console.warn('⚠️  Could not detect changed routes, falling back to full build:', error.message);
}

// Step 2: Restore previous build output from cache if it exists and doing partial build
if (isPartialBuild && existsSync(CACHED_OUTPUT_DIR)) {
  console.log('📦 Restoring previous build output from cache...');
  if (!existsSync(OUTPUT_DIR)) {
    const outputParent = join(process.cwd(), '.output');
    if (!existsSync(outputParent)) {
      mkdirSync(outputParent, { recursive: true });
    }
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  cpSync(CACHED_OUTPUT_DIR, OUTPUT_DIR, { recursive: true, force: false });
  console.log('✅ Restored previous build output');
} else if (isPartialBuild) {
  console.log('⚠️  No cached build found, will do full build for this run');
  isPartialBuild = false;
}

// Step 3: Run Nuxt generate with PARTIAL_BUILD env var if needed
console.log('🔨 Running Nuxt generate...');
try {
  const env = { ...process.env };
  if (isPartialBuild) {
    env.PARTIAL_BUILD = 'true';
    console.log('   Mode: Partial build (only changed blog routes)');
  } else {
    console.log('   Mode: Full build (all routes)');
  }
  
  execSync('npm run generate', { 
    stdio: 'inherit', 
    cwd: process.cwd(),
    env 
  });
  console.log('✅ Nuxt generate completed');
} catch (error) {
  console.error('❌ Nuxt generate failed:', error);
  process.exit(1);
}

// Step 4: Save current build output to cache for next build
if (existsSync(OUTPUT_DIR)) {
  console.log('💾 Caching build output for next build...');
  if (!existsSync(CACHED_OUTPUT_DIR)) {
    mkdirSync(CACHED_OUTPUT_DIR, { recursive: true });
  }
  cpSync(OUTPUT_DIR, CACHED_OUTPUT_DIR, { recursive: true, force: true });
  console.log('✅ Build output cached');
}

console.log('🎉 Build completed!');

