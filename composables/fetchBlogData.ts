// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { BlogPost, Event, NewsItem, WeeklyNews } from '@/types/index.ts';
import { fetchWeeklyNewsItems } from './fetchWeeklyNews';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());



export async function fetchBlogData(slug?: string): Promise<BlogPost[]> {
  try {
    const filter = slug
      ? {
          _and: [
            { slug: { _eq: slug } },
            { status: { _eq: 'published' } },
            
          ]
        }
      : {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } }  
          ]
        };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 13,
        meta: 'total_count',
        sort: ['-date'],
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ],
        filter
      })
    );

    return response as BlogPost[];
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return [];
  }
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  try {

    const filter = {
      _and: [
        { status: { _eq: 'published' } },
        { date: { _nnull: true } }  
      ]
    };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: -1,
        sort: ['-date'],
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ],
        filter
      })
    );

    return response as BlogPost[];
  } catch (error) {
    console.error('Error fetching all blog posts:', error);
    return [];
  }
}

/**
 * Get Directus auth token from environment (server-side only)
 */
function getDirectusAuthToken(): string | null {
  if (import.meta.server) {
    return process.env.DIRECTUS_AUTH_TOKEN || null;
  }
  return null;
}

/**
 * Query Directus revisions to find an item that previously had a given slug
 * 
 * NOTE: We use Revisions (not Content Versions) because:
 * - Revisions = Historical changes that have already been applied
 * - Content Versions = Future/draft changes that haven't been published yet
 * 
 * When a slug changes from "old" to "new", the old slug exists in Revisions history,
 * not in Content Versions (which are for drafts).
 * 
 * Also note: Both Revisions and Content Versions store data in JSON fields (data/delta),
 * and Directus cannot filter/search within JSON fields, so we must fetch and check manually.
 * 
 * @param slug - The old slug to search for in revision history
 * @returns The item ID if found, null otherwise
 */
async function findItemIdByOldSlug(slug: string): Promise<string | null> {
  const logPrefix = import.meta.server ? '[SERVER]' : '[CLIENT]';
  console.log(`${logPrefix} [Revision Lookup] Starting search for slug: "${slug}"`);
  
  // Only run on server-side where we have access to the auth token
  if (!import.meta.server) {
    console.log(`${logPrefix} [Revision Lookup] Skipping - client-side execution`);
    return null;
  }

  const authToken = getDirectusAuthToken();
  if (!authToken) {
    console.log(`${logPrefix} [Revision Lookup] ✗ No DIRECTUS_AUTH_TOKEN found in environment`);
    return null;
  }

  try {
    // Try using Directus's native JSON querying (if available in your Directus version)
    // Based on PR #21158 and #15889, Directus may support json() function for filtering
    // If this doesn't work, we'll fall back to manual pagination
    
    console.log(`${logPrefix} [Revision Lookup] Attempting native JSON query for slug "${slug}"...`);
    
    // Try filtering by data.slug using json() function
    // Syntax: filter[json(data$.slug)][_eq]=slug-value
    const jsonFilterUrl = `${API_URL}revisions?filter[collection][_eq]=reboot_democracy_blog&filter[json(data$.slug)][_eq]=${encodeURIComponent(slug)}&fields=id,item,collection&limit=1`;
    
    try {
      const jsonResponse = await fetch(jsonFilterUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (jsonResponse.ok) {
        const jsonResult = await jsonResponse.json();
        const jsonRevisions = jsonResult?.data || [];
        
        if (jsonRevisions.length > 0) {
          const itemId = jsonRevisions[0].item;
          console.log(`${logPrefix} [Revision Lookup] ✓ Found slug using native JSON query in data.slug, mapped to item ID: ${itemId}`);
          return itemId;
        }
      }
    } catch (jsonError: any) {
      console.log(`${logPrefix} [Revision Lookup] Native JSON query for data.slug failed (may not be supported), trying delta.slug...`);
    }
    
    // Try filtering by delta.slug using json() function
    const deltaFilterUrl = `${API_URL}revisions?filter[collection][_eq]=reboot_democracy_blog&filter[json(delta$.slug)][_eq]=${encodeURIComponent(slug)}&fields=id,item,collection&limit=1`;
    
    try {
      const deltaResponse = await fetch(deltaFilterUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (deltaResponse.ok) {
        const deltaResult = await deltaResponse.json();
        const deltaRevisions = deltaResult?.data || [];
        
        if (deltaRevisions.length > 0) {
          const itemId = deltaRevisions[0].item;
          console.log(`${logPrefix} [Revision Lookup] ✓ Found slug using native JSON query in delta.slug, mapped to item ID: ${itemId}`);
          return itemId;
        }
      }
    } catch (deltaError: any) {
      console.log(`${logPrefix} [Revision Lookup] Native JSON query for delta.slug failed, falling back to manual pagination...`);
    }
    
    // Fallback: Manual pagination if native JSON queries don't work
    console.log(`${logPrefix} [Revision Lookup] Native JSON queries not available/working, using manual pagination...`);
    
    // Use pagination to search through all revisions in batches
    // This prevents memory issues and allows us to search through all revisions
    const BATCH_SIZE = 100;
    const MAX_REVISIONS = 50000; // Safety limit to prevent runaway queries
    let offset = 0;
    let totalChecked = 0;
    
    while (totalChecked < MAX_REVISIONS) {
      const revisionsUrl = `${API_URL}revisions?filter[collection][_eq]=reboot_democracy_blog&fields=id,item,collection,data,delta&sort=-id&limit=${BATCH_SIZE}&offset=${offset}`;
      
      if (offset === 0) {
        console.log(`${logPrefix} [Revision Lookup] Starting paginated search (batch size: ${BATCH_SIZE})...`);
      }
      
      const response = await fetch(revisionsUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${logPrefix} [Revision Lookup] REST API response status: ${response.status} (offset: ${offset})`);
      
      if (!response.ok) {
        console.error(`${logPrefix} [Revision Lookup] REST API request failed: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error(`${logPrefix} [Revision Lookup] Error body:`, errorBody);
        break;
      }
      
      const result = await response.json();
      const revisions = result?.data || [];
      
      if (revisions.length === 0) {
        console.log(`${logPrefix} [Revision Lookup] No more revisions to check (reached end at offset ${offset})`);
        break;
      }
      
      console.log(`${logPrefix} [Revision Lookup] Checking batch: ${revisions.length} revisions (offset: ${offset}, total checked: ${totalChecked})...`);
      
      // Check each revision for exact slug match in data.slug or delta.slug
      for (const revision of revisions) {
        try {
          // Check data.slug field (full item state at revision time)
          if (revision.data) {
            const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
            if (data && typeof data === 'object' && data.slug === slug) {
              const itemId = revision.item;
              console.log(`${logPrefix} [Revision Lookup] ✓ Found exact slug match in data.slug (revision ${revision.id}, checked ${totalChecked + 1} revisions), mapped to item ID: ${itemId}`);
              return itemId;
            }
          }
          
          // Check delta.slug field (changed fields only)
          if (revision.delta) {
            const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
            if (delta && typeof delta === 'object' && delta.slug === slug) {
              const itemId = revision.item;
              console.log(`${logPrefix} [Revision Lookup] ✓ Found exact slug match in delta.slug (revision ${revision.id}, checked ${totalChecked + 1} revisions), mapped to item ID: ${itemId}`);
              return itemId;
            }
          }
        } catch (parseError: any) {
          continue;
        }
      }
      
      totalChecked += revisions.length;
      
      // If we got fewer revisions than requested, we've reached the end
      if (revisions.length < BATCH_SIZE) {
        console.log(`${logPrefix} [Revision Lookup] Reached end of revisions (got ${revisions.length}, expected ${BATCH_SIZE})`);
        break;
      }
      
      // Move to next batch
      offset += BATCH_SIZE;
    }
    
    if (totalChecked >= MAX_REVISIONS) {
      console.log(`${logPrefix} [Revision Lookup] ✗ Reached safety limit (${MAX_REVISIONS} revisions). Slug "${slug}" not found in checked revisions.`);
    } else {
      console.log(`${logPrefix} [Revision Lookup] ✗ Slug "${slug}" not found in ${totalChecked} revisions (searched all available)`);
    }
    
    console.log(`${logPrefix} [Revision Lookup] ✗ Slug "${slug}" not found in revision history`);
    return null;
  } catch (error: any) {
    console.error(`${logPrefix} [Revision Lookup] Error querying revisions for slug ${slug}:`, error.message || error);
    console.error(`${logPrefix} [Revision Lookup] Full error stack:`, error.stack);
    return null;
  }
}

/**
 * Fetch a blog post by its ID (used when slug lookup fails but we have the item ID from revisions)
 */
async function fetchBlogById(itemId: string): Promise<BlogPost | null> {
  try {
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 1,
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*',
          'audio_version.*'
        ],
        filter: {
          id: { _eq: itemId }
        }
      })
    );

    const blogs = response as BlogPost[];
    return blogs.length > 0 && blogs[0] ? blogs[0] : null;
  } catch (error) {
    console.error(`Error fetching blog with ID ${itemId}:`, error);
    return null;
  }
}

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  const logPrefix = import.meta.server ? '[SERVER]' : '[CLIENT]';
  console.log(`${logPrefix} [fetchBlogBySlug] Looking for blog with slug: "${slug}"`);
  
  try {
    // First, try to fetch by current slug
    const filter = {
      _and: [
        { slug: { _eq: slug } },
        { status: { _eq: 'published' } },
      ]
    };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 1,
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*',
          'audio_version.*'
        ],
        filter
      })
    );

    const blogs = response as BlogPost[];
    if (blogs.length > 0 && blogs[0] !== undefined) {
      const logMsg = `[fetchBlogBySlug] ✓ Found blog with current slug: "${slug}"`;
      if (import.meta.server) {
        console.log(`[SERVER] ${logMsg}`);
      } else {
        console.log(`[CLIENT] ${logMsg}`);
      }
      return blogs[0];
    }

    // If not found, check revision history for old slug
    const logMsg = `[fetchBlogBySlug] Blog post with slug "${slug}" not found in current collection, checking revision history...`;
    if (import.meta.server) {
      console.log(`[SERVER] ${logMsg}`);
    } else {
      console.log(`[CLIENT] ${logMsg}`);
    }
    const itemId = await findItemIdByOldSlug(slug);
    
    if (itemId) {
      console.log(`${logPrefix} [fetchBlogBySlug] Found item ID from revisions: ${itemId}, fetching current version...`);
      // Fetch the current version of the item using the ID from revision
      const blogPost = await fetchBlogById(itemId);
      if (blogPost) {
        console.log(`${logPrefix} [fetchBlogBySlug] ✓ Successfully retrieved blog post via revision history. Current slug: ${blogPost.slug}, ID: ${blogPost.id}`);
        return blogPost;
      } else {
        console.log(`${logPrefix} [fetchBlogBySlug] ✗ Could not fetch blog post with ID ${itemId}`);
      }
    } else {
      console.log(`${logPrefix} [fetchBlogBySlug] ✗ Could not find slug "${slug}" in revision history`);
    }

    console.log(`${logPrefix} [fetchBlogBySlug] ✗ Blog post with slug "${slug}" not found`);
    return null;
  } catch (error: any) {
    console.error(`${logPrefix} [fetchBlogBySlug] Error fetching blog with slug ${slug}:`, error.message || error);
    return null;
  }
}

export async function fetchRelatedBlogsByTags(tags: string[], excludeSlug: string): Promise<BlogPost[]> {
  if (!tags?.length) return [];

  try {
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        sort: ['-date'],
        limit: 10,
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ],
        filter: {
          _and: [
            { Tags: { _in: tags } },
            { slug: { _neq: excludeSlug } },
            { status: { _eq: 'published' } },
          ]
        }
      })
    );
    return (response as BlogPost[]).slice(0, 3);
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

// Normalize tag labels to merge similar variants
const normalizeTagLabel = (name: string): string => {
  if (!name) return name;
  const normalized = name.trim().toLowerCase();
  if (normalized === "news that caught our eye") {
    return "News that Caught Our Eye";
  }
  return name;
};

export async function fetchAllUniqueTags(): Promise<string[]> {
  try {
    const blogPosts = await fetchAllBlogPosts();
    const weeklyNewsItems = await fetchWeeklyNewsItems();
    const uniqueTags = new Set<string>();

    blogPosts.forEach((post) => {
      if (post.Tags && Array.isArray(post.Tags)) {
        post.Tags.forEach((tag) => {
          uniqueTags.add(normalizeTagLabel(tag));
        });
      }
    });

    weeklyNewsItems.forEach((newsItem) => {
      if (newsItem.category) {
        uniqueTags.add(normalizeTagLabel(newsItem.category));
      }
    });

    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error fetching unique tags:', error);
    return [];
  }
}

export async function fetchAllSlugs(): Promise<string[]> {
  try {
    const posts = await directus.request(
      readItems('reboot_democracy_blog', {
        fields: ['slug'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },

            { date: { _nnull: true } }  
          ]
        },
        limit: -1
      })
    );

    return posts.map((post: any) => `/blog/${post.slug}`);
  } catch (error) {
    console.error('Failed to fetch slugs for prerendering:', error);
    return [];
  }
}

export async function fetchLatestCombinedPosts(): Promise<any[]> {
  try {
    // Fetch both blog and weekly news in parallel
    const [blogResult, newsResult] = await Promise.all([
          
      directus.request(readItems('reboot_democracy_blog', {
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ],
        limit: 6,
        sort: ['-date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } }  
          ]
        }
      })),
      directus.request(readItems('reboot_democracy_weekly_news', {
        fields: ['*.*'],
        limit: 6,
        sort: ['-date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } }  
          ]
        }
      }))
    ]);


    const blogWithType = (blogResult || []).map(item => ({
     
      type: 'blog',
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      one_line: item.one_line,
      authors: item.authors,
      date: item.date,
      slug: item.slug,
      image: item.image,
      status: item.status,
      Tags: item.Tags,
      content: item.content,
    }));
    
    const newsWithType = (newsResult || []).map(item => ({
      type: 'news',
      id: item.id,
      title: item.title,
      one_line: item.one_line,
      excerpt: item.summary, 
      author: item.author,
      authorString: item.author,
      date: item.date,
      edition: item.edition,
      slug: null, 
      image: item.image, 
      status: item.status,
      Tags: ['News that caught our eye'], 
      category: 'News that caught our eye'
    }));

    // Combine and sort by date descending
    const combined = [...blogWithType, ...newsWithType]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    return combined;
  } catch (error) {
    console.error('Error fetching combined latest posts:', error);
    return [];
  }
}