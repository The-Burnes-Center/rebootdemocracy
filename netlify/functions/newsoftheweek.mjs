import { createDirectus, rest, readItems } from '@directus/sdk';
import he from 'he';

const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

export const handler = async (event, context) => {
  try {
    const jstoxml = await import('jstoxml');
    const toXML = jstoxml.toXML || jstoxml;

    console.log("Attempting to fetch data from Directus...");
    
    const publicData = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        filter: {
          or: [
            { status: { _eq: "published" } },
            { status: { _eq: "Scheduled" } }
          ],
        },
        sort: ['-id'],
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"]
      })
    );

    let newsData;
    if (publicData.data) {
      newsData = publicData.data;
    } else if (Array.isArray(publicData)) {
      newsData = publicData;
    } else {
      return {
        statusCode: 404,
        body: 'No news data found. Unexpected response structure.',
      };
    }

    if (!newsData || newsData.length === 0) {
      return {
        statusCode: 404,
        body: 'No news data found.',
      };
    }

    const channel = [
      { title: newsData[0].title || "Reboot Democracy Weekly News" },
      { description: newsData[0].summary || "Weekly news updates" },
      { link: 'https://rebootdemocracy.ai' },
      { lastBuildDate: () => new Date().toUTCString() },
      { pubDate: () => new Date().toUTCString() },
      { language: 'en' },
      {
        _name: "atom:link",
        _attrs: {
          href: 'https://rebootdemocracy.ai/feed/rss',
          rel: 'self',
          type: 'application/rss+xml',
        }
      }
    ];

    if (newsData[0].items && Array.isArray(newsData[0].items)) {
      newsData[0].items.forEach(e_items => {
        const newsItem = e_items.reboot_democracy_weekly_news_items_id;
        if (newsItem) {
          channel.push({
            item: {
              title: newsItem.title || "Untitled",
              pubDate: newsItem.date || new Date().toUTCString(),
              author: `${newsItem.author || 'Unknown'} in ${newsItem.publication || 'Unknown Publication'}`,
              link: newsItem.url || 'https://rebootdemocracy.ai',
              description: newsItem.excerpt || '',
              category: newsItem.category || 'News',
            }
          });
        }
      });
    }

    const xmlOptions = {
      header: true,
      indent: '  '
    };

    const rssFeed = toXML(
      {
        _name: 'rss',
        _attrs: {
          version: '2.0',
          ["xmlns:atom"]: 'http://www.w3.org/2005/Atom',
          ["xmlns:media"]: 'http://search.yahoo.com/mrss/'
        },
        _content: {
          channel: channel,
        },
      },
      xmlOptions
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8'
      },
      body: rssFeed,
    };

  } catch (error) {
    console.error('Error generating RSS:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error: ' + error.message + '\n\nStack: ' + error.stack,
    };
  }
};
