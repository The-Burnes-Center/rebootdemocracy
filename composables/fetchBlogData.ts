// blogService.ts
import type { BlogPost } from '@/types/BlogPost';
import { useDirectusClient } from './useDirectusClient.js';
export async function fetchBlogData(slug?: string): Promise<BlogPost[]> {
  const { directus, readItems } = useDirectusClient();
  
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

export async function fetchFeaturedBlog(): Promise<BlogPost | null> {
  const { directus, readItems } = useDirectusClient();

  try {
    const filter = {
      _and: [
        { featuredBlog: { _eq: true } },
        { status: { _eq: 'published' } },
        { date: { _lte: '$NOW(-5 hours)' } }  // <- Make sure date isn't in future
      ]
    };

    console.log("Fetching featured blog with filter:", filter);

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
    console.log("Featured blog response:", blogs);

    return blogs.length ? blogs[0] : null;
  } catch (error) {
    console.error('Error fetching featured blog:', error);
    return null;
  }
}
