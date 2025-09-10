// blogService.ts
import { createDirectus, rest, readItems } from '@directus/sdk';
import type { WeeklyNews } from '@/types/index.ts';

const API_URL = 'https://burnes-center.directus.app/';
const directus = createDirectus(API_URL).with(rest());

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

export async function fetchLatestWeeklyNews(): Promise<WeeklyNews | null> {
  try {
    const nowOffset = getDirectusNowOffset();
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
              { date: { _lte: nowOffset } },
              { title: { _contains: titlePattern } }
            ]
          },
          sort: ['-date', '-id'],
          limit: 1
        })
      );

      if (response && response.length > 0) {
        console.log(`Found news with pattern "${titlePattern}":`, response[0]);
        return response[0];
      }
    }

    console.log('No matches with title filters, trying manual search...');
    
    const allResponse = await directus.request<WeeklyNews[]>(
      readItems('reboot_democracy_weekly_news', {
        fields: ['id', 'edition', 'title', 'summary', 'author', 'status', 'date'],
        filter: {
          _and: [
            { status: { _eq: 'published' } },
            { date: { _lte: nowOffset } }
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
      console.log('Found news with manual search:', newsEntry);
      return newsEntry;
    }

    console.log('No "News that caught our eye" found');
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
    const nowOffset = getDirectusNowOffset();
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
            { date: { _lte: nowOffset } },
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
    
    // Transform weekly news entries to be compatible with the combined blog/news structure
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