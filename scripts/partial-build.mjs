// scripts/partial-build.mjs
// Netlify build script for partial SSG - only rebuilds changed blog routes
import { execSync, spawnSync } from 'child_process';
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

// Get blog entry ID from environment variables (set by Netlify build hook)
// Netlify build hooks can send payload via INCOMING_HOOK_BODY or custom env vars
const blogEntryId = process.env.BLOG_ENTRY_ID || process.env.INCOMING_HOOK_BODY;

// Debug logging to see what we received
if (process.env.BLOG_ENTRY_ID) {
  console.log(`📦 BLOG_ENTRY_ID env var present: ${process.env.BLOG_ENTRY_ID.substring(0, 50)}...`);
}
if (process.env.INCOMING_HOOK_BODY) {
  console.log(`📦 INCOMING_HOOK_BODY env var present: ${process.env.INCOMING_HOOK_BODY.substring(0, 100)}...`);
}
if (!blogEntryId) {
  console.log('⚠️  No blog entry ID found in environment variables (BLOG_ENTRY_ID or INCOMING_HOOK_BODY)');
}

// Try to parse JSON from INCOMING_HOOK_BODY if it's a JSON string
let parsedId = blogEntryId;
if (blogEntryId && typeof blogEntryId === 'string') {
  try {
    const parsed = JSON.parse(blogEntryId);
    parsedId = parsed.id || parsed.BLOG_ENTRY_ID || parsed.payload?.id || blogEntryId;
    console.log(`📝 Parsed blog entry ID from JSON: ${parsedId}`);
  } catch {
    // Not JSON, use as-is
    parsedId = blogEntryId;
    console.log(`📝 Using blog entry ID as-is (not JSON): ${parsedId}`);
  }
}

if (parsedId) {
  console.log(`✅ Blog entry ID from webhook: ${parsedId}`);
} else {
  console.log('ℹ️  No blog entry ID available - will detect changes via manifest comparison');
}

let isPartialBuild = false;
try {
  // Run TypeScript file to detect changed routes
  // Pass the blog entry ID as environment variable
  const env = { ...process.env };
  if (parsedId) {
    env.BLOG_ENTRY_ID = parsedId;
  }
  
  // Use spawn to capture stdout and stderr separately
  const result = spawnSync('npx', ['tsx', 'scripts/get-changed-blog-routes.ts'], {
    encoding: 'utf-8',
    cwd: process.cwd(),
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Get only stdout (JSON output) and stderr separately
  const stdout = result.stdout ? result.stdout.toString().trim() : '';
  const stderr = result.stderr ? result.stderr.toString().trim() : '';
  
  if (result.error) {
    throw result.error;
  }
  
  if (result.status !== 0) {
    // Try to parse error from stderr as JSON
    let errorMessage = `Script failed with status ${result.status}`;
    if (stderr) {
      try {
        const errorJson = JSON.parse(stderr);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // Not JSON, use stderr as error message
        errorMessage = stderr || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }
  
  // Validate that stdout is not empty before parsing
  if (!stdout) {
    throw new Error('Script produced no output');
  }
  
  // Parse JSON from stdout (should be only JSON, no logs)
  let changedRoutes;
  try {
    changedRoutes = JSON.parse(stdout);
  } catch (parseError) {
    // If parsing fails, it means stdout contains non-JSON content
    throw new Error(`Failed to parse JSON output. Output was: ${stdout.substring(0, 100)}...`);
  }
  
  // Ensure changedRoutes is an array
  if (!Array.isArray(changedRoutes)) {
    throw new Error(`Expected array, got ${typeof changedRoutes}`);
  }
  
  if (changedRoutes.length > 0) {
    isPartialBuild = true;
    console.log(`✅ Found ${changedRoutes.length} changed blog route(s)`);
    console.log(`   Routes: ${changedRoutes.join(', ')}`);
  } else {
    console.log('ℹ️  No changed blog routes detected, will do full build');
  }
} catch (error) {
  console.warn('⚠️  Could not detect changed routes, falling back to full build:', error.message);
  // Log stderr if available for debugging
  if (error.stderr) {
    try {
      const errorJson = JSON.parse(error.stderr.toString());
      console.warn('   Error details:', errorJson.error);
    } catch {
      // Not JSON error, log as-is
      if (error.stderr.toString().trim()) {
        console.warn('   Stderr:', error.stderr.toString().trim());
      }
    }
  }
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

