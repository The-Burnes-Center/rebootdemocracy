// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const { createDirectus, rest, readItems } = require('@directus/sdk');
const he = require('he');

// Fix for the jstoxml ESM module issue
let toXML;
async function initializeJsToXml() {
  const jstoxml = await import('jstoxml');
  toXML = jstoxml.default.toXML || jstoxml.toXML;
  return toXML;
}

const directus = createDirectus('https://burnes-center.directus.app/').with(rest());

export const handler = async function (event, context) {
  try {
    // Initialize the jstoxml module
    const toXML = await initializeJsToXml();
    
    console.log("Attempting to fetch blog data from Directus...");
    
    const publicData = await directus.request(
      readItems("reboot_democracy_blog", {
        filter: {
          _and: [
            { date: { _lte: "$NOW(-5 hours)" } },
            { status: { _eq: "published" } },
          ],
        },
        limit: -1,
        sort: ['-date'], // Changed to array format for sort
        fields: ["*.*", "authors.team_id.*"]
      })
    );
    
    console.log("Data retrieved, checking structure...");
    
    // Handle different response structures in newer SDK versions
    let blogData;
    if (publicData.data) {
      console.log("Data found in publicData.data");
      blogData = publicData.data;
    } else if (Array.isArray(publicData)) {
      console.log("Data found directly in publicData array");
      blogData = publicData;
    } else {
      console.log("Unexpected response structure:", typeof publicData);
      return {
        statusCode: 404,
        body: 'No blog posts found. Unexpected response structure.',
      };
    }
    
    if (!blogData || blogData.length === 0) {
      console.log("No blog posts found in response");
      return {
        statusCode: 404,
        body: 'No blog posts found.',
      };
    }
    
    console.log(`Found ${blogData.length} blog posts`);

    // Base channel info
    const channel = [
      { title: 'Reboot Democracy Blog' },
      { description: 'The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.' },
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

    // Add each blog post
    blogData.forEach((post) => {
      if (post.status === "published") {
        let authorNames = "";

        if (post.authors && Array.isArray(post.authors) && post.authors.length > 0) {
          authorNames = "By " + post.authors
            .map(author => {
              if (author.team_id && author.team_id.First_Name && author.team_id.Last_Name) {
                return `${author.team_id.First_Name} ${author.team_id.Last_Name}`;
              }
              return "Unknown Author";
            })
            .join(", ") + "<br/>";
        }

        let descriptionContent = `${authorNames}${decodeEntities(post.content || "")}`;
        let enclosure = null;
        let mediaContent = null;

        if (post.image && post.image.id) {
          const imageUrl = `https://burnes-center.directus.app/assets/${post.image.id}?width=400&quality=70&format=jpg`;

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

          descriptionContent = `<![CDATA[<img src="${imageUrl}" alt="${post.title || "Blog post"}" /><br/>${descriptionContent}]]>`;
        } else {
          descriptionContent = `<![CDATA[${descriptionContent}]]>`;
        }

        const item = {
          item: {
            title: decodeEntities(post.title || "Untitled"),
            link: `https://rebootdemocracy.ai/blog/${post.slug || post.id}`,
            guid: `https://rebootdemocracy.ai/blog/${post.slug || post.id}`,
            pubDate: buildRFC822Date(post.date || new Date().toISOString()),
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
      body: 'Internal Server Error: ' + error.message + '\n\nStack: ' + error.stack,
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