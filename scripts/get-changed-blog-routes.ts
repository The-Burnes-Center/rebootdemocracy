// scripts/get-changed-blog-routes.ts
// Detects which blog routes have changed and need to be regenerated
import { createDirectus, rest, readItems, readItem } from '@directus/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.netlify', 'cache');
const MANIFEST_FILE = join(CACHE_DIR, 'blog-routes-manifest.json');

interface BlogRouteManifest {
  routes: Record<string, string>; // route -> date_updated timestamp
  lastUpdated: string;
}

export const getChangedBlogRoutes = async (blogEntryId?: string): Promise<{
  changedRoutes: string[];
  allRoutes: string[];
}> => {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

  // If blog entry ID is provided (from webhook), fetch only that specific post
  if (blogEntryId) {
    try {
      const post = await directus.request(
        readItem('reboot_democracy_blog', blogEntryId, {
          fields: ['slug', 'date_updated', 'status', 'date'],
        })
      );

      // Only regenerate if the post is published and not in the future
      const isPublished = post.status === 'published';
      const isNotFuture = post.date ? new Date(post.date) <= new Date() : true;
      
      if (isPublished && isNotFuture) {
        const route = `/blog/${post.slug}`;
        const changedRoutes = [route];
        
        // Update manifest with this route
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
        
        // Update manifest with this route's timestamp
        manifest.routes[route] = post.date_updated || new Date().toISOString();
        manifest.lastUpdated = new Date().toISOString();
        writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
        
        // Save changed routes
        const changedRoutesFile = join(CACHE_DIR, 'changed-routes.json');
        writeFileSync(changedRoutesFile, JSON.stringify(changedRoutes, null, 2));
        
        return {
          changedRoutes,
          allRoutes: Object.keys(manifest.routes),
        };
      } else {
        // Post is not published or is in the future, return empty
        return {
          changedRoutes: [],
          allRoutes: [],
        };
      }
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
  const changedRoutesFile = join(CACHE_DIR, 'changed-routes.json');
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
  const blogEntryId = process.env.BLOG_ENTRY_ID || process.env.INCOMING_HOOK_BODY || process.argv[2];
  
  // Try to parse JSON from INCOMING_HOOK_BODY if it's a JSON string
  let parsedId = blogEntryId;
  if (blogEntryId && typeof blogEntryId === 'string') {
    try {
      const parsed = JSON.parse(blogEntryId);
      parsedId = parsed.id || parsed.BLOG_ENTRY_ID || parsed.payload?.id || blogEntryId;
    } catch {
      // Not JSON, use as-is
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

