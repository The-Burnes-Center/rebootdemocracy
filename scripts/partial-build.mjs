// scripts/partial-build.mjs
// Netlify build script for partial SSG - only rebuilds changed blog routes
import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, readdirSync, statSync, rmSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), '.output', 'public');
// Use Netlify's persistent cache directory (survives between builds)
// Netlify provides /opt/build/cache which is automatically persisted between builds
// Fallback to .netlify/cache for local development
const CACHE_DIR = process.env.NETLIFY_CACHE_DIR || (process.platform === 'linux' ? '/opt/build/cache' : join(process.cwd(), '.netlify', 'cache'));
const CACHED_OUTPUT_DIR = join(CACHE_DIR, 'rebootdemocracy', '.output', 'public');
const MANIFEST_CACHE_DIR = join(CACHE_DIR, 'rebootdemocracy', 'manifests');

// Ensure cache directories exist
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}
if (!existsSync(MANIFEST_CACHE_DIR)) {
  mkdirSync(MANIFEST_CACHE_DIR, { recursive: true });
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
// Support both single ID (integer) and array of IDs
let parsedIds = null;
if (blogEntryId && typeof blogEntryId === 'string') {
  try {
    const parsed = JSON.parse(blogEntryId);
    const idValue = parsed.id || parsed.BLOG_ENTRY_ID || parsed.payload?.id || blogEntryId;
    
    // Handle both single ID and array of IDs
    if (Array.isArray(idValue)) {
      parsedIds = idValue;
      console.log(`📝 Parsed blog entry IDs from JSON (array): ${parsedIds.join(', ')}`);
    } else {
      parsedIds = [idValue];
      console.log(`📝 Parsed blog entry ID from JSON (single): ${parsedIds[0]}`);
    }
  } catch {
    // Not JSON, try to parse as single ID or comma-separated IDs
    const idParts = blogEntryId.split(',').map(id => id.trim()).filter(id => id);
    if (idParts.length > 1) {
      parsedIds = idParts;
      console.log(`📝 Parsed blog entry IDs from comma-separated string: ${parsedIds.join(', ')}`);
    } else {
      parsedIds = [blogEntryId];
      console.log(`📝 Using blog entry ID as-is (not JSON): ${parsedIds[0]}`);
    }
  }
}

let isPartialBuild = false;
let blogRoutes = []; // Store changed routes for cache restoration

if (parsedIds && parsedIds.length > 0) {
  console.log(`✅ Blog entry ID(s) from webhook: ${Array.isArray(parsedIds) ? parsedIds.join(', ') : parsedIds}`);
  // Only do partial build if webhook ID is provided
  // If no webhook ID, always do full build (e.g., manual builds, scheduled builds)
  try {
    // Run TypeScript file to detect changed routes
    // Pass the blog entry IDs as JSON array in environment variable
    const env = { ...process.env };
    // Pass as JSON string so the script can parse it as array or single value
    env.BLOG_ENTRY_ID = JSON.stringify(parsedIds);
    
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
    blogRoutes = changedRoutes; // Store for later use
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
} else {
  // No webhook ID provided - always do full build
  // This covers: manual builds, scheduled builds, branch deploys, etc.
  console.log('ℹ️  No webhook ID provided - performing full build');
  isPartialBuild = false;
}

// Step 2: For partial builds, save cache location info (we'll restore after generation)
let cachedOutputExists = false;
if (isPartialBuild) {
  console.log('📦 Checking for cached build output...');
  console.log(`   Cache directory: ${CACHE_DIR}`);
  console.log(`   Cached output directory: ${CACHED_OUTPUT_DIR}`);
  
  if (existsSync(CACHE_DIR)) {
    console.log(`   ✅ Cache directory exists`);
    // List what's in the cache directory
    try {
      const cacheContents = readdirSync(CACHE_DIR, { withFileTypes: true });
      console.log(`   📁 Cache contents: ${cacheContents.map(item => item.name).join(', ')}`);
    } catch (e) {
      // Ignore read errors
      console.log(`   ⚠️  Could not read cache directory: ${e.message}`);
    }
  } else {
    console.log(`   ⚠️  Cache directory does not exist`);
  }
  
  if (existsSync(CACHED_OUTPUT_DIR)) {
    cachedOutputExists = true;
    console.log('✅ Found cached build output - will restore after generation');
  } else {
    console.log('⚠️  No cached build found in .netlify/cache/.output/public');
    console.log('   This is normal for the first build on a branch or after cache was cleared.');
    console.log('   The cache will be saved after this build completes for use in the next build.');
    isPartialBuild = false;
  }
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

// Step 4: For partial builds, restore ALL cached files first, then overlay newly generated files
if (isPartialBuild && cachedOutputExists) {
  console.log('📦 Restoring ALL cached files from previous build...');
  if (existsSync(CACHED_OUTPUT_DIR) && existsSync(OUTPUT_DIR)) {
    try {
      // Create a temporary directory to store newly generated files
      const TEMP_GEN_DIR = join(process.cwd(), '.output', 'temp-generated');
      
      // Move newly generated files to temp directory
      console.log('   Moving newly generated files to temp location...');
      if (existsSync(TEMP_GEN_DIR)) {
        // Clean up any existing temp dir
        rmSync(TEMP_GEN_DIR, { recursive: true, force: true });
      }
      mkdirSync(TEMP_GEN_DIR, { recursive: true });
      cpSync(OUTPUT_DIR, TEMP_GEN_DIR, { recursive: true });
      
      // Now restore ALL files from cache (this restores all unchanged routes)
      console.log('   Restoring all cached files...');
      cpSync(CACHED_OUTPUT_DIR, OUTPUT_DIR, { recursive: true, force: false });
      
      // Finally, overlay the newly generated files (overwrites only changed routes)
      console.log('   Overlaying newly generated files (changed routes)...');
      cpSync(TEMP_GEN_DIR, OUTPUT_DIR, { recursive: true, force: true });
      
      // Clean up temp directory
      rmSync(TEMP_GEN_DIR, { recursive: true, force: true });
      
      console.log('✅ Restored cached files and merged with newly generated files');
    } catch (error) {
      console.warn('⚠️  Could not restore cached files, using generated output only:', error.message);
      console.warn('   Error details:', error);
    }
  }
}

// Step 5: Save current build output to cache for next build
if (existsSync(OUTPUT_DIR)) {
  console.log('💾 Caching build output for next build...');
  if (!existsSync(CACHED_OUTPUT_DIR)) {
    mkdirSync(CACHED_OUTPUT_DIR, { recursive: true });
  }
  cpSync(OUTPUT_DIR, CACHED_OUTPUT_DIR, { recursive: true, force: true });
  console.log('✅ Build output cached');
}

console.log('🎉 Build completed!');

