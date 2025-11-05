// scripts/get-changed-blog-routes.ts
// Detects which blog routes have changed and need to be regenerated
import { createDirectus, rest, readItems } from '@directus/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.netlify', 'cache');
const MANIFEST_FILE = join(CACHE_DIR, 'blog-routes-manifest.json');

interface BlogRouteManifest {
  routes: Record<string, string>; // route -> date_updated timestamp
  lastUpdated: string;
}

export const getChangedBlogRoutes = async (): Promise<{
  changedRoutes: string[];
  allRoutes: string[];
}> => {
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Fetch all current blog routes from Directus with their update timestamps
  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());
  
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
        console.warn('Legacy manifest format detected, converting to new format');
        const legacyRoutes = previousManifest.routes as unknown as string[];
        previousManifest.routes = {};
        legacyRoutes.forEach(route => {
          previousManifest!.routes[route] = previousManifest!.lastUpdated;
        });
      }
    } catch (error) {
      console.warn('Could not read previous manifest, will regenerate all routes');
    }
  }

  // Determine changed routes
  let changedRoutes: string[];
  if (!previousManifest) {
    // First build - regenerate all blog routes
    console.log('No previous manifest found, will regenerate all blog routes');
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
      console.log(`Found ${deletedRoutes.length} deleted routes, will clean up in next build`);
      // Note: We don't need to regenerate all routes for deletions, 
      // just remove them from the manifest (they'll be removed from cache on next deploy)
    }
    
    changedRoutes = Array.from(changedRoutesSet);
    
    const newCount = changedRoutes.filter(r => !previousRoutesMap[r]).length;
    const updatedCount = changedRoutes.length - newCount;
    
    if (changedRoutes.length > 0) {
      console.log(`Found ${changedRoutes.length} changed blog routes:`);
      console.log(`  - ${newCount} new routes`);
      console.log(`  - ${updatedCount} updated routes (content changed)`);
    } else {
      console.log('No changed blog routes detected');
    }
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

// If run directly, output routes as JSON
if (import.meta.url.endsWith(process.argv[1] || '')) {
  getChangedBlogRoutes()
    .then(({ changedRoutes }) => {
      console.log(JSON.stringify(changedRoutes));
    })
    .catch((error) => {
      console.error('Error getting changed blog routes:', error);
      process.exit(1);
    });
}

