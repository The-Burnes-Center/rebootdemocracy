// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg from 'jstoxml';
import { createDirectus, rest } from '@directus/sdk';
import he from 'he';

const directus = createDirectus('https://content.thegovlab.com/').with(rest());

export const handler = async function (event, context) {
  try {
    const { toXML } = pkg;

    const publicData = await directus.request(
      rest.items('reboot_democracy_weekly_news').readByQuery({
        filter: { _and: [{ status: { _eq: "published" } } ] },
        limit: -1,
        sort: '-id',
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"]
      })
    );

    if (!publicData.data || publicData.data.length === 0) {
      return {
        statusCode: 404,
        body: 'No news data found.',
      };
    }

    // Build the channel metadata
    const channel = [
      { title: publicData.data[0].title },
      { description: publicData.data[0].summary },
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

    // Add items from the public data
    publicData.data.forEach(e => {
      const item = {
        item: {
          title: e.title,
          pubDate: e.date,
          GUID: e.id,
        }
      };
      channel.push(item);
    });

    const xmlOptions = {
      header: true,
      indent: '  ', // Ensures proper indentation
    };

    const rssFeed = toXML(
      {
        _name: 'rss',
        _attrs: {
          version: '2.0',
          ["xmlns:atom"]: 'http://www.w3.org/2005/Atom',
          ["xmlns:media"]: 'http://search.yahoo.com/mrss/',
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

// Helper functions (not currently used but kept if needed in future)
function addLeadingZero(num) {
  num = num.toString();
  while (num.length < 2) num = "0" + num;
  return num;
}

function decodeEntities(encodedString) {
  return he.decode(encodedString || "");
}

function buildRFC822Date(dateString) {
  const dayStrings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthStrings = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const timeStamp = Date.parse(dateString);
  const date = new Date(timeStamp);

  const day = dayStrings[date.getDay()];
  const dayNumber = addLeadingZero(date.getDate());
  const month = monthStrings[date.getMonth()];
  const year = date.getFullYear();
  const time = `${addLeadingZero(date.getHours())}:${addLeadingZero(date.getMinutes())}:00`;
  const timezone = date.getTimezoneOffset() === 0 ? "GMT" : "BST";

  return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
}
