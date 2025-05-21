// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { BlogPost, Event } from '@/types/index.ts';
import { fetchWeeklyNewsItems } from './fetchWeeklyNews';

const API_URL = 'https://content.thegovlab.com';
const directus = createDirectus(API_URL).with(rest());

export async function fetchBlogData(slug?: string): Promise<BlogPost[]> {
  try {
    const filter = slug
      ? {
          _and: [
            { slug: { _eq: slug } },
            { status: { _eq: 'published' } },
            { date: { _lte: '$NOW(-5 hours)' } }
          ]
        }
      : {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _lte: '$NOW(-5 hours)' } }
          ]
        };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 7,
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
        { date: { _lte: '$NOW(-5 hours)' } }
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

export async function fetchFeaturedBlog(): Promise<BlogPost | null> {
  try {
    const filter = {
      _and: [
        { featuredBlog: { _eq: true } },
        { status: { _eq: 'published' } },
        { date: { _lte: '$NOW(-5 hours)' } }
      ]
    };

    const response = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 1,
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

    const blogs = response as BlogPost[];
    return blogs.length ? blogs[0] : null;
  } catch (error) {
    console.error('Error fetching featured blog:', error);
    return null;
  }
}

export async function fetchBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filter = {
      _and: [
        { slug: { _eq: slug } },
        { status: { _eq: 'published' } },
        { date: { _lte: '$NOW(-5 hours)' } }
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

export async function fetchAllUniqueTags(): Promise<string[]> {
  try {
    const blogPosts = await fetchAllBlogPosts();
    const weeklyNewsItems = await fetchWeeklyNewsItems();
    const uniqueTags = new Set<string>();

    blogPosts.forEach((post) => {
      if (post.Tags && Array.isArray(post.Tags)) {
        post.Tags.forEach((tag) => {
          uniqueTags.add(tag);
        });
      }
    });

    weeklyNewsItems.forEach((newsItem) => {
      if (newsItem.category) {
        uniqueTags.add(newsItem.category);
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
          date: { _lte: '$NOW(-5 hours)' }
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