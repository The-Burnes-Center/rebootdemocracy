// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg from 'jstoxml';
import { createDirectus, rest } from '@directus/sdk';
import he from 'he';

const directus = createDirectus('https://content.thegovlab.com/').with(rest());

export const handler = async function (event, context) {
  try {
    const { toXML } = pkg;

    const publicData = await directus.request(
      rest.items("reboot_democracy_weekly_news").readByQuery({
        filter: {
          _and: [
            {
              status: {
                _eq: "published"
              }
            }
          ],
        },
        sort: '-id',
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"]
      })
    );

    if (!publicData.data || publicData.data.length === 0) {
      return {
        statusCode: 404,
        body: 'No news data found.',
      };
    }

    // Start building the RSS channel
    const channel = [
      {
        title: publicData.data[0].title
      },
      {
        description: publicData.data[0].summary
      },
      {
        link: 'https://rebootdemocracy.ai'
      },
      {
        lastBuildDate: new Date().toUTCString()
      },
      {
        pubDate: new Date().toUTCString()
      },
      {
        language: 'en'
      },
      {
        _name: "atom:link",
        _attrs: {
          href: 'https://rebootdemocracy.ai/feed/rss',
          rel: 'self',
          type: 'application/rss+xml',
        }
      }
    ];

    // Now loop over the news items and add them as <item> in the RSS
    publicData.data[0].items.forEach(e_items => {
      const newsItem = e_items.reboot_democracy_weekly_news_items_id;

      if (newsItem) {
        const itemcont = {
          item: {
            title: newsItem.title,
            pubDate: newsItem.date,
            author: `${newsItem.author} in ${newsItem.publication}`,
            link: newsItem.url,
            description: newsItem.excerpt,
            category: newsItem.category,
          }
        };
        channel.push(itemcont);
      }
    });

    const xmlOptions = {
      header: true,
      indent: '  ' // Ensures proper indentation
    };

    const rssFeed = toXML(
      {
        _name: 'rss',
        _attrs: {
          version: '2.0',
          ["xmlns:atom"]: 'http://www.w3.org/2005/Atom',
          ["xmlns:media"]: 'http://search.yahoo.com/mrss/' // Add media namespace
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
      body: 'Internal Server Error',
    };
  }
};
