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
    const { directus, readItems } = useDirectusClient();
    
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
  const { directus, readItems } = useDirectusClient();

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
            {
              Tags: {
                _in: tags
              }
            },
            {
              slug: {
                _neq: excludeSlug
              }
            },
            {
              status: { _eq: 'published' }
            },
            {
              date: { _lte: '$NOW' } 
            }
          ]
        }
      })
    );

    return (response as BlogPost[]).slice(0, 3); // Only top 3
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}


