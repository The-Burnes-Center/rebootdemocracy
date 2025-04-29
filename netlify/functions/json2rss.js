// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg from 'jstoxml';
import { createDirectus, rest } from '@directus/sdk';
import he from 'he';

const directus = createDirectus('https://content.thegovlab.com/').with(rest());

export const handler = async function (event, context) {
  try {
    const { toXML } = pkg;

    const publicData = await directus.request(
      rest.items("reboot_democracy_blog").readByQuery({
        filter: {
          _and: [
            { date: { _lte: "$NOW(-5 hours)" } },
            { status: { _eq: "published" } },
          ],
        },
        limit: -1,
        sort: '-date',
        fields: ["*.*", "authors.team_id.*"]
      })
    );

    if (!publicData.data || publicData.data.length === 0) {
      return {
        statusCode: 404,
        body: 'No blog posts found.',
      };
    }

    // Base channel info
    const channel = [
      { title: 'Reboot Democracy Blog' },
      { description: 'The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.' },
      { link: 'https://rebootdemocracy.ai' },
      { lastBuildDate: new Date().toUTCString() },
      { pubDate: new Date().toUTCString() },
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

    // Add each blog post
    publicData.data.forEach((post) => {
      if (post.status === "published") {
        let authorNames = "";

        if (post.authors && Array.isArray(post.authors) && post.authors.length > 0) {
          authorNames = "By " + post.authors
            .map(author => `${author.team_id.First_Name} ${author.team_id.Last_Name}`)
            .join(", ") + "<br/>";
        }

        let descriptionContent = `${authorNames}${decodeEntities(post.content)}`;
        let enclosure = null;
        let mediaContent = null;

        if (post.image && post.image.id) {
          const imageUrl = `https://content.thegovlab.com/assets/${post.image.id}?width=400&quality=70&format=jpg`;

          enclosure = {
            _attrs: {
              url: imageUrl,
              type: "image/jpeg"
            }
          };

          mediaContent = {
            _attrs: {
              url: imageUrl,
              type: "image/jpeg",
              medium: "image"
            }
          };

          descriptionContent = `<![CDATA[<img src="${imageUrl}" alt="${post.title}" /><br/>${descriptionContent}]]>`;
        } else {
          descriptionContent = `<![CDATA[${descriptionContent}]]>`;
        }

        const item = {
          item: {
            title: decodeEntities(post.title),
            link: `https://rebootdemocracy.ai/blog/${post.slug}`,
            guid: `https://rebootdemocracy.ai/blog/${post.slug}`,
            pubDate: buildRFC822Date(post.date),
            description: descriptionContent,
          }
        };

        if (enclosure) item.item.enclosure = enclosure;
        if (mediaContent) item.item["media:content"] = mediaContent;

        channel.push(item);
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
      body: 'Internal Server Error',
    };
  }
};

// Helper functions
function addLeadingZero(num) {
  return num.toString().padStart(2, '0');
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
