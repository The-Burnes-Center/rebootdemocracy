// composables/blogHelper.js - DRAFT BRANCH VERSION (SIMPLIFIED - NO AUTH)
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { BlogPost } from '@/types/BlogPost';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

/**
 * Query Directus revisions to find an item that previously had a given slug
 * @param slug - The old slug to search for in revision history
 * @returns The item ID if found, null otherwise
 */
async function findItemIdByOldSlug(slug: string): Promise<string | null> {
  const logPrefix = import.meta.server ? '[SERVER]' : '[CLIENT]';
  console.log(`${logPrefix} [Revision Lookup] Starting search for slug: "${slug}"`);
  
  try {
    // Try using REST API directly first (revisions endpoint)
    try {
      console.log(`${logPrefix} [Revision Lookup] Trying REST API /revisions endpoint...`);
      const revisionsUrl = `${API_URL}revisions?filter[collection][_eq]=reboot_democracy_blog&sort=-id&limit=200&fields=id,item,collection,data,delta&search=${encodeURIComponent(slug)}`;
      console.log(`${logPrefix} [Revision Lookup] Request URL: ${revisionsUrl}`);
      
      const response = await fetch(revisionsUrl);
      console.log(`${logPrefix} [Revision Lookup] REST API response status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        const revisions = result?.data || [];
        console.log(`${logPrefix} [Revision Lookup] REST API returned ${revisions.length} revisions`);
        
        // Search through results
        for (const revision of revisions) {
          try {
            // Check data field
            if (revision.data) {
              const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
              if (data && typeof data === 'object' && data.slug === slug) {
                const itemId = revision.item;
                console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision data (revision ${revision.id}), mapped to item ID: ${itemId}`);
                return itemId;
              }
            }
            
            // Check delta field
            if (revision.delta) {
              const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
              if (delta && typeof delta === 'object' && delta.slug === slug) {
                const itemId = revision.item;
                console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision delta (revision ${revision.id}), mapped to item ID: ${itemId}`);
                return itemId;
              }
            }
          } catch (parseError: any) {
            continue;
          }
        }
        
        // If search didn't find it, try without search parameter
        if (revisions.length === 0 || revisions.length < 50) {
          console.log(`${logPrefix} [Revision Lookup] Trying without search parameter for broader results...`);
          const broaderUrl = `${API_URL}revisions?filter[collection][_eq]=reboot_democracy_blog&sort=-id&limit=200&fields=id,item,collection,data,delta`;
          const broaderResponse = await fetch(broaderUrl);
          
          if (broaderResponse.ok) {
            const broaderResult = await broaderResponse.json();
            const broaderRevisions = broaderResult?.data || [];
            console.log(`${logPrefix} [Revision Lookup] Found ${broaderRevisions.length} total revisions without search`);
            
            for (const revision of broaderRevisions) {
              try {
                if (revision.data) {
                  const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
                  if (data && typeof data === 'object' && data.slug === slug) {
                    const itemId = revision.item;
                    console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision data (revision ${revision.id}), mapped to item ID: ${itemId}`);
                    return itemId;
                  }
                }
                
                if (revision.delta) {
                  const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
                  if (delta && typeof delta === 'object' && delta.slug === slug) {
                    const itemId = revision.item;
                    console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision delta (revision ${revision.id}), mapped to item ID: ${itemId}`);
                    return itemId;
                  }
                }
              } catch (parseError: any) {
                continue;
              }
            }
          }
        }
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.log(`${logPrefix} [Revision Lookup] REST API returned status ${response.status}: ${response.statusText}`);
        console.log(`${logPrefix} [Revision Lookup] Error response: ${errorText}`);
      }
    } catch (restError: any) {
      console.log(`${logPrefix} [Revision Lookup] REST API approach failed:`, restError.message);
      console.error(`${logPrefix} [Revision Lookup] Full error:`, restError);
    }

    // Fallback: Try SDK with collection names
    console.log(`${logPrefix} [Revision Lookup] Trying SDK approach...`);
    const revisionCollectionNames = ['directus_revisions', 'revisions'];
    let revisions: any[] = [];

    for (const collection of revisionCollectionNames) {
      try {
        console.log(`${logPrefix} [Revision Lookup] Trying SDK collection: ${collection}`);
        revisions = await directus.request(
          readItems(collection as any, {
            fields: ['id', 'item', 'collection', 'data', 'delta'],
            filter: {
              collection: { _eq: 'reboot_democracy_blog' }
            },
            sort: ['-id'],
            limit: 200
          })
        ) as any[];

        console.log(`${logPrefix} [Revision Lookup] SDK found ${revisions.length} revisions in collection ${collection}`);
        break;
      } catch (err: any) {
        console.log(`${logPrefix} [Revision Lookup] SDK collection ${collection} failed:`, err.message);
        console.error(`${logPrefix} [Revision Lookup] SDK error details:`, err);
        continue;
      }
    }

    if (revisions.length === 0) {
      console.log(`${logPrefix} [Revision Lookup] ✗ No revisions found for collection reboot_democracy_blog`);
      return null;
    }

    // Search through SDK results
    console.log(`${logPrefix} [Revision Lookup] Searching through ${revisions.length} SDK revisions for slug "${slug}"`);
    for (const revision of revisions) {
      try {
        if (revision.data) {
          const data = typeof revision.data === 'string' ? JSON.parse(revision.data) : revision.data;
          if (data && typeof data === 'object' && data.slug === slug) {
            const itemId = revision.item;
            console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision data (revision ${revision.id}), mapped to item ID: ${itemId}`);
            return itemId;
          }
        }
        
        if (revision.delta) {
          const delta = typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta;
          if (delta && typeof delta === 'object' && delta.slug === slug) {
            const itemId = revision.item;
            console.log(`${logPrefix} [Revision Lookup] ✓ Found old slug "${slug}" in revision delta (revision ${revision.id}), mapped to item ID: ${itemId}`);
            return itemId;
          }
        }
      } catch (parseError: any) {
        continue;
      }
    }
    
    console.log(`${logPrefix} [Revision Lookup] ✗ Slug "${slug}" not found in ${revisions.length} revisions`);
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
  // Log to both server and client
  if (import.meta.server) {
    console.log(`[SERVER] [fetchBlogBySlug] Looking for blog with slug: "${slug}"`);
  } else {
    console.log(`[CLIENT] [fetchBlogBySlug] Looking for blog with slug: "${slug}"`);
  }
  
  try {
    // First, try to fetch by current slug
    const filter = {
      slug: { _eq: slug }
      // NO STATUS FILTER - Shows both draft and published
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
    if (blogs.length > 0 && blogs[0]) {
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
      console.log(`[fetchBlogBySlug] Found item ID from revisions: ${itemId}, fetching current version...`);
      // Fetch the current version of the item using the ID from revision
      const blogPost = await fetchBlogById(itemId);
      if (blogPost) {
        console.log(`[fetchBlogBySlug] ✓ Successfully retrieved blog post via revision history. Current slug: ${blogPost.slug}, ID: ${blogPost.id}`);
        return blogPost;
      } else {
        console.log(`[fetchBlogBySlug] ✗ Could not fetch blog post with ID ${itemId}`);
      }
    } else {
      console.log(`[fetchBlogBySlug] ✗ Could not find slug "${slug}" in revision history`);
    }

    console.log(`[fetchBlogBySlug] ✗ Blog post with slug "${slug}" not found`);
    return null;
  } catch (error: any) {
    console.error(`[fetchBlogBySlug] Error fetching blog with slug ${slug}:`, error.message || error);
    return null;
  }
}

// Fetch related blogs by tags - SHOWS BOTH DRAFT AND PUBLISHED
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
            { slug: { _neq: excludeSlug } }
            // NO STATUS FILTER - Shows both draft and published
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

// Fetch all blog posts - SHOWS BOTH DRAFT AND PUBLISHED
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const filter = {
      date: { _nnull: true }
      // NO STATUS FILTER
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

// Fetch blog data (for blog listing page) - SHOWS BOTH DRAFT AND PUBLISHED
export async function fetchBlogData(slug?: string): Promise<BlogPost[]> {
  try {
    const filter = slug
      ? {
          slug: { _eq: slug }
          // NO STATUS FILTER
        }
      : {
          date: { _nnull: true }
          // NO STATUS FILTER
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

// Fetch all unique tags - INCLUDES DRAFT POSTS
export async function fetchAllUniqueTags(): Promise<string[]> {
  try {
    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: -1,
        fields: ['Tags'],
        // NO STATUS FILTER
      })
    );
    
    const uniqueTags = new Set<string>();
    (response as any[]).forEach((post) => {
      if (post.Tags && Array.isArray(post.Tags)) {
        post.Tags.forEach((tag: string) => uniqueTags.add(tag));
      }
    });
    
    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error fetching unique tags:', error);
    return [];
  }
}

// Fetch latest combined posts - INCLUDES DRAFTS
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
          date: { _nnull: true }
          // NO STATUS FILTER
        }
      })),
      directus.request(readItems('reboot_democracy_weekly_news', {
        fields: ['*.*'],
        limit: 6,
        sort: ['-date'],
        filter: {
          date: { _nnull: true }
          // NO STATUS FILTER
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

// Fetch all slugs - For route generation (if needed)
export async function fetchAllSlugs(): Promise<string[]> {
  try {
    const posts = await directus.request(
      readItems('reboot_democracy_blog', {
        fields: ['slug'],
        filter: {
          date: { _nnull: true }
          // NO STATUS FILTER
        },
        limit: -1
      })
    );

    return posts.map((post: any) => `/blog/${post.slug}`);
  } catch (error) {
    console.error('Failed to fetch slugs:', error);
    return [];
  }
}