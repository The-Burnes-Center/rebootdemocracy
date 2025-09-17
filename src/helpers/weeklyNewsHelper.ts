import { createDirectus, rest, readItems } from '@directus/sdk';
import type { WeeklyNews } from '@/types/WeeklyNews';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

// Interface for a weekly news item
interface WeeklyNewsItem {
  id: string;
  title: string;
  author: string;
  publication: string;
  date: string;
  excerpt: string;
  url: string;
  category?: string;
  related_links?: RelatedNewsItem[] | '';
}

interface RelatedNewsItem {
  reboot_weekly_news_related_news_id: {
    title: string;
    link: string;
  };
}

interface WeeklyNewsItemWrapper {
  reboot_democracy_weekly_news_items_id: WeeklyNewsItem;
}

interface WeeklyNewsPost extends WeeklyNews {
  items?: WeeklyNewsItemWrapper[];
  events?: string;
  announcements?: string;
}

export async function fetchWeeklyNewsByEdition(edition: string): Promise<WeeklyNewsPost | null> {
  try {
    const filter = {
      _and: [
        { edition: { _eq: edition } }
      ]
    };

    const response = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit: 1,
        fields: [
          '*.*',
          'image.*',
          'items.reboot_democracy_weekly_news_items_id.*',
          'items.reboot_democracy_weekly_news_items_id.related_links.*.*'
        ],
        filter
      })
    );

    const news = response as WeeklyNewsPost[];
    return news.length ? news[0] : null;
  } catch (error) {
    console.error(`Error fetching weekly news with edition ${edition}:`, error);
    return null;
  }
}

export async function fetchAllWeeklyNews(): Promise<WeeklyNewsPost[]> {
  try {
    const filter = {
      date: { _nnull: true }
    };

    const response = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit: -1,
        sort: ['-date'],
        fields: [
          '*.*',
          'image.*'
        ],
        filter
      })
    );

    return response as WeeklyNewsPost[];
  } catch (error) {
    console.error('Error fetching all weekly news:', error);
    return [];
  }
}

// Fetch latest weekly news posts - SHOWS BOTH DRAFT AND PUBLISHED
export async function fetchLatestWeeklyNews(limit: number = 6): Promise<WeeklyNewsPost[]> {
  try {
    const filter = {
      date: { _nnull: true }
      // NO STATUS FILTER
    };

    const response = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit,
        sort: ['-date'],
        fields: [
          '*.*',
          'image.*'
        ],
        filter
      })
    );

    return response as WeeklyNewsPost[];
  } catch (error) {
    console.error('Error fetching latest weekly news:', error);
    return [];
  }
}

// Get the latest edition number - INCLUDES DRAFT POSTS
export async function getLatestEdition(): Promise<string | null> {
  try {
    const response = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        fields: ['edition'],
        limit: -1,
        // NO STATUS FILTER - Shows both draft and published
      })
    );

    if (response && response.length > 0) {
      const editions = response
        .map((item: any) => parseInt(item.edition))
        .filter((edition: number) => !isNaN(edition))
        .sort((a: number, b: number) => b - a);

      if (editions.length > 0) {
        return editions[0].toString();
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest edition:', error);
    return null;
  }
}

// Fetch all editions for route generation (if needed) - INCLUDES DRAFT POSTS
export async function fetchAllEditions(): Promise<string[]> {
  try {
    const posts = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        fields: ['edition'],
        filter: {
          date: { _nnull: true }
          // NO STATUS FILTER
        },
        limit: -1
      })
    );

    return posts.map((post: any) => `/newsthatcaughtoureye/${post.edition}`);
  } catch (error) {
    console.error('Failed to fetch editions:', error);
    return [];
  }
}

// Fetch weekly news data with full details - SHOWS BOTH DRAFT AND PUBLISHED
export async function fetchWeeklyNewsData(edition?: string): Promise<WeeklyNewsPost[]> {
  try {
    const filter = edition
      ? {
          _and: [
            { edition: { _eq: edition } }
            // NO STATUS FILTER
          ]
        }
      : {
          date: { _nnull: true }
          // NO STATUS FILTER
        };

    const response = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit: edition ? 1 : -1,
        meta: 'total_count',
        sort: ['-date'],
        fields: [
          '*.*',
          'image.*',
          'items.reboot_democracy_weekly_news_items_id.*',
          'items.reboot_democracy_weekly_news_items_id.related_links.*.*'
        ],
        filter
      })
    );

    return response as WeeklyNewsPost[];
  } catch (error) {
    console.error('Error fetching weekly news data:', error);
    return [];
  }
}

// Helper function to get unique categories from a weekly news post
export function getUniqueCategories(post: WeeklyNewsPost): string[] {
  if (!post.items) return [];
  
  const categories = post.items.map(
    (item) => item.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye'
  );
  
  return [...new Set(categories)];
}

// Helper function to get items by category
export function getItemsByCategory(post: WeeklyNewsPost, category: string): WeeklyNewsItemWrapper[] {
  if (!post.items) return [];
  
  return post.items.filter((wrapper) => {
    const itemCategory = wrapper.reboot_democracy_weekly_news_items_id.category || 'News that caught our eye';
    return itemCategory === category;
  });
}
