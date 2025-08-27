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
            { date: { _lte: '$NOW' } }
          ]
        }
      : {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _lte: '$NOW' } }
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
         { date: { _lte: '$NOW' } }
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

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filter = {
      _and: [
        { slug: { _eq: slug } },
        { status: { _eq: 'published' } },
        { date: { _lte: '$NOW' } }
      ]
    };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 1,
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
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
            { date: { _lte: '$NOW' } }
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
          status: { _eq: 'published' },
          date: { _lte: '$NOW' }
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
            { date: { _lte: '$NOW' } }
          ]
        }
      })),
      directus.request(readItems('reboot_democracy_weekly_news', {
        fields: ['*.*'],
        limit: 6,
        sort: ['-date'],
        filter: {
          status: { _eq: 'published' },
          date: { _nnull: true }
        }
      }))
    ]);

    // Before combining, tag each item with type
    const blogWithType = (blogResult || []).map(item => ({
      type: 'blog',
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      authors: item.authors,
      date: item.date,
      slug: item.slug,
      image: item.image,
      status: item.status,
      Tags: item.Tags,
      content: item.content,
      // Add any other blog-specific fields you need
    }));

    const newsWithType = (newsResult || []).map(item => ({
      type: 'news',
      id: item.id,
      title: item.title,
      excerpt: item.summary, 
      authors: item.author, 
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