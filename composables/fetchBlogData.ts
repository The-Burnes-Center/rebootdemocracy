// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { BlogPost, Event, NewsItem } from '@/types/index.ts';
import { fetchWeeklyNewsItems } from './fetchWeeklyNews';

const API_URL = 'https://directus.theburnescenter.org';
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

// export async function fetchFeaturedBlog(): Promise<BlogPost | null> {
//   try {
//     const filter = {
//       _and: [
//         { featuredBlog: { _eq: true } },
//         { status: { _eq: 'published' } },
//         { date: { _lte: '$NOW(-5 hours)' } }
//       ]
//     };

//     const response = await directus.request(
//       readItems('reboot_democracy_blog', {
//         limit: 1,
//         sort: ['-date'],
//         fields: [
//           '*.*',
//           'authors.team_id.*',
//           'authors.team_id.Headshot.*',
//           'image.*'
//         ],
//         filter
//       })
//     );

//     const blogs = response as BlogPost[];
//     return blogs.length ? blogs[0] : null;
//   } catch (error) {
//     console.error('Error fetching featured blog:', error);
//     return null;
//   }
// }

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

export async function fetchLatestCombinedPosts(): Promise<(BlogPost | NewsItem)[]> {
  try {
    const blogPosts = await directus.request(
      readItems('reboot_democracy_blog', {
        limit: 5, 
        sort: ['-date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _lte: '$NOW(-5 hours)' } }
          ]
        },
        fields: [
          '*.*',
          'authors.team_id.*',
          'authors.team_id.Headshot.*',
          'image.*'
        ]
      })
    );

    // Step 2: Fetch all weekly news items
    const newsItems = await fetchWeeklyNewsItems();

    // Step 3: Add type identifier to distinguish between blog posts and news items
    const blogPostsWithType = (blogPosts as BlogPost[]).map(post => ({
      ...post,
      _type: 'blog' as const
    }));

    const newsItemsWithType = newsItems.map(item => ({
      ...item,
      _type: 'news' as const
    }));

    // Step 4: Merge all items
    const allItems = [...blogPostsWithType, ...newsItemsWithType];

    // Step 5: Sort with weekly news priority
    allItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      // If dates are different, sort by date (newest first)
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      
      // If dates are the same, prioritize weekly news
      if (a._type === 'news' && b._type === 'blog') return -1;
      if (a._type === 'blog' && b._type === 'news') return 1;
      
      return 0;
    });

    return allItems.slice(0, 3);
  } catch (error) {
    console.error('Error fetching combined latest posts:', error);
    return [];
  }
}
