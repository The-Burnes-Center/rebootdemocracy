// composables/getStaticNewsRoutes.ts
import { createDirectus, rest, readItems } from '@directus/sdk';

export const getStaticNewsRoutes = async (): Promise<string[]> => {
  const directus = createDirectus('https://burnes-center.directus.app/').with(rest());
  
  const newsEditions = await directus.request(
    readItems('reboot_democracy_weekly_news', {
      fields: ['edition'],
      filter: {
        _and: [
          { status: { _eq: 'published' } },
          { date: { _lte: '$NOW' } }
        ]
      },
      limit: -1,
    })
  );
  
  return newsEditions.map((news: any) => `/newsthatcaughtoureye/${news.edition}`);
};