// scripts/fetchStaticRoutes.ts
import { createDirectus, rest, readItems } from '@directus/sdk';


export const getStaticBlogRoutes = async (): Promise<string[]> => {
  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

  const posts = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: ['slug'],
      filter: {
        status: { _eq: 'published' },
        date: { _lte: '$NOW' },
      },
      limit: -1,
    })
  );

  return posts.map((post: any) => `/blog/${post.slug}`);
};
