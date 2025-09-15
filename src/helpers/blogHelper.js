// composables/blogHelper.js - DRAFT BRANCH VERSION (SIMPLIFIED - NO AUTH)
import { createDirectus, rest, readItems } from '@directus/sdk';
import { BlogPost } from '@/types/BlogPost';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
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
    return blogs.length ? blogs[0] : null;
  } catch (error) {
    console.error(`Error fetching blog with slug ${slug}:`, error);
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
        post.Tags.forEach((tag) => uniqueTags.add(tag));
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