// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { WeeklyNews } from '@/types/index.ts';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());



export async function fetchLatestWeeklyNews(): Promise<WeeklyNews | null> {
  try {

    const titleVariations = [
      'News that Caught Our Eye',  
      'News that caught our eye',  
      'News That Caught Our Eye'   
    ];

    for (const titlePattern of titleVariations) {
      const response = await directus.request<WeeklyNews[]>(
        readItems('reboot_democracy_weekly_news', {
          fields: ['id', 'edition', 'title', 'summary', 'author', 'status', 'date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } },
            { title: { _contains: titlePattern } }
          ]
        },
          sort: ['-date', '-id'],
          limit: 1
        })
      );

      if (response && response.length > 0) {
        return response[0];
      }
    }

    const allResponse = await directus.request<WeeklyNews[]>(
      readItems('reboot_democracy_weekly_news', {
        fields: ['id', 'edition', 'title', 'summary', 'author', 'status', 'date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } }  
          ]
        },
        sort: ['-date', '-id'],
        limit: 20
      })
    );

    const newsEntry = allResponse.find(item => 
      item.title?.toLowerCase().includes('news that caught our eye') ||
      item.title?.toLowerCase().includes('caught our eye')
    );

    if (newsEntry) {
      return newsEntry;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest weekly news:', error);
    return null;
  }
}

export async function fetchLatestWeeklyNewsId(): Promise<number | null> {
  try {
    const latestNews = await fetchLatestWeeklyNews();
    return latestNews?.id || null;
  } catch (error) {
    console.error('Error fetching latest weekly news ID:', error);
    return null;
  }
}

// UPDATED: Fetches only "News that caught our eye" entries
export async function fetchWeeklyNewsEntries(): Promise<WeeklyNews[]> {
  try {
    const weeklyNewsEntries = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        limit: -1,
        sort: ['-date'],
        fields: [
          'id',
          'edition', 
          'title',
          'summary',
          'author',
          'date',
          'status',
          'image.*' 
        ],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _nnull: true } }, 
            {
              _or: [
                { title: { _contains: 'News that Caught Our Eye' } },
                { title: { _contains: 'News That Caught Our Eye' } },
                { title: { _contains: 'News that caught our eye' } },
                { title: { _contains: 'news that caught our eye' } }
              ]
            }
          ]
        }
      })
    );

    if (!Array.isArray(weeklyNewsEntries) || weeklyNewsEntries.length === 0) {
      return [];
    }
    // Return only the "News that caught our eye" entries
    return weeklyNewsEntries as WeeklyNews[];
    
  } catch (error) {
    console.error('Error fetching weekly news entries:', error);
    return [];
  }
}

// UPDATED: Returns only "News that caught our eye" entries formatted for combined blog/news display
export async function fetchWeeklyNewsItems(): Promise<any[]> {
  try {
    const weeklyNewsEntries = await fetchWeeklyNewsEntries();
    return weeklyNewsEntries.map((entry) => ({
      type: 'news',
      id: entry.id,
      title: entry.title,
      excerpt: entry.summary, 
      authors: entry.author, 
      author: entry.author, 
      date: entry.date,
      edition: entry.edition,
      slug: null, 
      image: entry.image, 
      status: entry.status,
      Tags: ['News that Caught Our Eye'], 
      category: 'News that Caught Our Eye'
    }));
  } catch (error) {
    console.error('Error fetching weekly news items:', error);
    return [];
  }
}