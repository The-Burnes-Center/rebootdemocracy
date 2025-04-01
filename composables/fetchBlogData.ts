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
        meta: 'total_count',
        limit: 2,
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