// ssg-config.ts
import { defineSsgConfig } from 'vite-ssg';
import { Directus } from '@directus/sdk';

export default defineSsgConfig({
  async onRoutesGenerated(routes) {
    const directus = new Directus('https://content.thegovlab.com/');
    const { data } = await directus.items('reboot_democracy_blog').readByQuery({
      fields: ['slug'],
      limit: -1,
    });

    const blogRoutes = data.map((post) => `/blog/${post.slug}`);

    return routes.concat(blogRoutes);
  },
});