// scripts/fetchStaticRoutes.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

// Helper function to determine if Eastern Time is in DST
function isEasternDST(date: Date): boolean {
  const year = date.getFullYear();

  // Calculate DST start: Second Sunday in March at 2:00 AM ET
  const march = new Date(year, 2, 1); // March 1st
  const firstSundayMarch = 7 - march.getDay();
  const secondSundayMarch = firstSundayMarch + 7;
  const dstStart = new Date(year, 2, secondSundayMarch, 2); // 2:00 AM

  // Calculate DST end: First Sunday in November at 2:00 AM ET
  const november = new Date(year, 10, 1); // November 1st
  const firstSundayNovember = november.getDay() === 0 ? 1 : (1 + (7 - november.getDay()));
  const dstEnd = new Date(year, 10, firstSundayNovember, 2); // 2:00 AM

  return date >= dstStart && date < dstEnd;
}

// Helper function to get the correct Directus NOW offset based on Eastern Time
function getDirectusNowOffset(): string {
  const now = new Date();
  return isEasternDST(now) ? '$NOW(-4 hours)' : '$NOW(-5 hours)';
}

export const getStaticBlogRoutes = async (): Promise<string[]> => {
  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

  const posts = await directus.request(
    readItems('reboot_democracy_blog', {
      fields: ['slug'],
      filter: {
        status: { _eq: 'published' },
        date: { _lte: getDirectusNowOffset() },
      },
      limit: -1,
    })
  );

  return posts.map((post: any) => `/blog/${post.slug}`);
};
