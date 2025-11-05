// scripts/get-changed-blog-routes.ts
// Detects which blog routes have changed and need to be regenerated
import { createDirectus, rest, readItems, readItem } from '@directus/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Use Netlify's persistent cache directory (survives between builds)
// Netlify provides /opt/build/cache which is automatically persisted between builds
// Fallback to .netlify/cache for local development
const CACHE_DIR = process.env.NETLIFY_CACHE_DIR || (process.platform === 'linux' ? '/opt/build/cache' : join(process.cwd(), '.netlify', 'cache'));
const MANIFEST_CACHE_DIR = join(CACHE_DIR, 'rebootdemocracy', 'manifests');
const MANIFEST_FILE = join(MANIFEST_CACHE_DIR, 'blog-routes-manifest.json');

interface BlogRouteManifest {
  routes: Record<string, string>; // route -> date_updated timestamp
  lastUpdated: string;
}

export const getChangedBlogRoutes = async (blogEntryId?: string | string[]): Promise<{
  changedRoutes: string[];
  allRoutes: string[];
}> => {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!existsSync(MANIFEST_CACHE_DIR)) {
    mkdirSync(MANIFEST_CACHE_DIR, { recursive: true });
  }

  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

  // If blog entry ID(s) is provided (from webhook), fetch only those specific posts
  if (blogEntryId) {
    try {
      // Normalize to array: handle both single ID and array of IDs
      const ids = Array.isArray(blogEntryId) ? blogEntryId : [blogEntryId];
      
      // Fetch all posts in parallel
      const posts = await Promise.all(
        ids.map(id => 
          directus.request(
            readItem('reboot_democracy_blog', String(id), {
              fields: ['slug', 'date_updated', 'status', 'date'],
            })
          ).catch(error => {
            // Log error but continue with other posts
            console.error(`Error fetching blog post ${id}:`, error);
            return null;
          })
        )
      );

      // Filter out null results and process valid posts
      const validPosts = posts.filter((post): post is any => post !== null);
      
      if (validPosts.length === 0) {
        // No valid posts found, fall through to full detection
        return {
          changedRoutes: [],
          allRoutes: [],
        };
      }

      // Filter for published, non-future posts
      const publishedPosts = validPosts.filter(post => {
        const isPublished = post.status === 'published';
        const isNotFuture = post.date ? new Date(post.date) <= new Date() : true;
        return isPublished && isNotFuture;
      });

      if (publishedPosts.length === 0) {
        // No published posts, return empty
        return {
          changedRoutes: [],
          allRoutes: [],
        };
      }

      // Build changed routes from all valid posts
      const changedRoutes = publishedPosts.map(post => `/blog/${post.slug}`);
      
      // Update manifest with these routes
      let manifest: BlogRouteManifest = {
        routes: {},
        lastUpdated: new Date().toISOString(),
      };
      
      if (existsSync(MANIFEST_FILE)) {
        try {
          const manifestContent = readFileSync(MANIFEST_FILE, 'utf-8');
          manifest = JSON.parse(manifestContent);
          // Handle legacy manifest format
          if (Array.isArray(manifest.routes)) {
            const legacyRoutes = manifest.routes as unknown as string[];
            manifest.routes = {};
            legacyRoutes.forEach(r => {
              manifest.routes[r] = manifest.lastUpdated;
            });
          }
        } catch (error) {
          // If manifest is corrupted, start fresh
        }
      }
      
      // Update manifest with all changed routes' timestamps
      publishedPosts.forEach(post => {
        const route = `/blog/${post.slug}`;
        manifest.routes[route] = post.date_updated || new Date().toISOString();
      });
      manifest.lastUpdated = new Date().toISOString();
      writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
      
      // Save changed routes
      const changedRoutesFile = join(MANIFEST_CACHE_DIR, 'changed-routes.json');
      writeFileSync(changedRoutesFile, JSON.stringify(changedRoutes, null, 2));
      
      return {
        changedRoutes,
        allRoutes: Object.keys(manifest.routes),
      };
    } catch (error) {
      // Silently fall through to full detection mode
      // Error will be logged to stderr if script is run directly
    }
  }

  // Fallback: Fetch all current blog routes from Directus with their update timestamps
  const posts = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: ['slug', 'date_updated'],
      filter: {
        status: { _eq: 'published' },
        date: { _lte: '$NOW' },
      },
      limit: -1,
    })
  );

  // Build current routes with their update timestamps
  const currentRoutesMap: Record<string, string> = {};
  posts.forEach((post: any) => {
    const route = `/blog/${post.slug}`;
    // Use date_updated if available, otherwise use current time
    const timestamp = post.date_updated || new Date().toISOString();
    currentRoutesMap[route] = timestamp;
  });

  const allRoutes = Object.keys(currentRoutesMap);
  const currentManifest: BlogRouteManifest = {
    routes: currentRoutesMap,
    lastUpdated: new Date().toISOString(),
  };

  // Load previous manifest if it exists
  let previousManifest: BlogRouteManifest | null = null;
  if (existsSync(MANIFEST_FILE)) {
    try {
      const manifestContent = readFileSync(MANIFEST_FILE, 'utf-8');
      previousManifest = JSON.parse(manifestContent);
      // Handle legacy manifest format (array of routes)
      if (Array.isArray(previousManifest.routes)) {
        const legacyRoutes = previousManifest.routes as unknown as string[];
        previousManifest.routes = {};
        legacyRoutes.forEach(route => {
          previousManifest!.routes[route] = previousManifest!.lastUpdated;
        });
      }
    } catch (error) {
      // If manifest is corrupted, start fresh
    }
  }

  // Determine changed routes
  let changedRoutes: string[];
  if (!previousManifest) {
    // First build - regenerate all blog routes
    changedRoutes = allRoutes;
  } else {
    const previousRoutesMap = previousManifest.routes;
    const changedRoutesSet = new Set<string>();
    
    // Check each current route
    for (const route of allRoutes) {
      const currentTimestamp = currentRoutesMap[route];
      const previousTimestamp = previousRoutesMap[route];
      
      // New route (not in previous manifest)
      if (!previousTimestamp) {
        changedRoutesSet.add(route);
      }
      // Existing route with updated timestamp (content was updated)
      else if (currentTimestamp !== previousTimestamp) {
        changedRoutesSet.add(route);
      }
    }
    
    // Find deleted routes (routes in previous manifest but not in current)
    const deletedRoutes = Object.keys(previousRoutesMap).filter(
      route => !currentRoutesMap[route]
    );
    
    if (deletedRoutes.length > 0) {
      // Note: We don't need to regenerate all routes for deletions
    }
    
    changedRoutes = Array.from(changedRoutesSet);
  }

  // Save current manifest for next build
  writeFileSync(MANIFEST_FILE, JSON.stringify(currentManifest, null, 2));

  // Save changed routes to a separate file for nuxt.config.ts to read
  const changedRoutesFile = join(MANIFEST_CACHE_DIR, 'changed-routes.json');
  writeFileSync(changedRoutesFile, JSON.stringify(changedRoutes, null, 2));

  return {
    changedRoutes,
    allRoutes,
  };
};

// If run directly, output routes as JSON (only JSON, no logs)
if (import.meta.url.endsWith(process.argv[1] || '')) {
  // Suppress all console output when run directly to ensure only JSON goes to stdout
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: any[]) => {
    // Only write to stderr, not stdout
    process.stderr.write(args.map(arg => String(arg)).join(' ') + '\n');
  };
  
  console.log = () => {}; // Suppress all console.log
  console.warn = () => {}; // Suppress all console.warn
  
  // Get blog entry ID from environment variable (set by Netlify build hook)
  const blogEntryIdRaw = process.env.BLOG_ENTRY_ID || process.env.INCOMING_HOOK_BODY || process.argv[2];
  
  // Try to parse JSON from environment variable - support both single ID and array
  let parsedId: string | string[] | undefined = undefined;
  if (blogEntryIdRaw && typeof blogEntryIdRaw === 'string') {
    try {
      const parsed = JSON.parse(blogEntryIdRaw);
      // Handle both single ID and array of IDs
      if (Array.isArray(parsed)) {
        parsedId = parsed;
      } else {
        const idValue = parsed.id || parsed.BLOG_ENTRY_ID || parsed.payload?.id || parsed;
        // Normalize to array: if it's already an array, use it; otherwise wrap in array
        parsedId = Array.isArray(idValue) ? idValue : [idValue];
      }
    } catch {
      // Not JSON, try to parse as comma-separated IDs
      if (blogEntryIdRaw.includes(',')) {
        parsedId = blogEntryIdRaw.split(',').map(id => id.trim()).filter(id => id);
      } else {
        // Single ID, wrap in array for consistency
        parsedId = [blogEntryIdRaw];
      }
    }
  }
  
  getChangedBlogRoutes(parsedId)
    .then(({ changedRoutes }) => {
      // Only output JSON to stdout, no other text
      process.stdout.write(JSON.stringify(changedRoutes));
      process.exit(0);
    })
    .catch((error) => {
      // Output error as JSON to stderr for easier parsing
      process.stderr.write(JSON.stringify({ error: error.message }));
      process.exit(1);
    });
}

