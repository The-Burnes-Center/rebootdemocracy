// scripts/fetchStaticRoutes.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

export const getStaticBlogRoutes = async (): Promise<string[]> => {
  const directus = createDirectus('https://dev.thegovlab.com').with(rest());

  const posts = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: ['slug'],
      filter: {
        status: { _eq: 'published' },
        date: { _lte: '$NOW(-5 hours)' },
      },
      limit: -1,
    })
  );

  return posts.map((post: any) => `/blog/${post.slug}`);
};
