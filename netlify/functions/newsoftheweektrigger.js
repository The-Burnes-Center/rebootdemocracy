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

const directus = createDirectus('https://burnes-center.directus.app//').with(rest());

exports.handler = async function (event, context) {
  try {
    // Initialize the jstoxml module
    const toXML = await initializeJsToXml();
    
    console.log("Attempting to fetch data from Directus...");
    
    // Try with simplified query first for debugging
    const publicData = await directus.request(
      readItems('reboot_democracy_weekly_news', {
        // Temporarily remove filter to see if any data exists
        // filter: { _and: [{ status: { _eq: "published" } } ] },
        limit: -1,
        sort: ['-id'],
        fields: ["*"]  // Simplified fields parameter
      })
    );
    
    console.log("Directus response:", JSON.stringify(publicData));
    
    // Check actual response structure
    if (!publicData || (Array.isArray(publicData) && publicData.length === 0)) {
      console.log("No data returned from Directus - empty array");
      return {
        statusCode: 404,
        body: 'No news data found. Response was empty array.',
      };
    }
    
    // Handle different response structures in newer SDK versions
    let newsData;
    if (publicData.data) {
      console.log("Data found in publicData.data");
      newsData = publicData.data;
    } else if (Array.isArray(publicData)) {
      console.log("Data found directly in publicData array");
      newsData = publicData;
    } else {
      console.log("Unexpected response structure:", typeof publicData);
      return {
        statusCode: 404,
        body: 'No news data found. Unexpected response structure.',
      };
    }
    
    if (newsData.length === 0) {
      console.log("News data array is empty");
      return {
        statusCode: 404,
        body: 'No news data found. Array was empty.',
      };
    }
    
    console.log(`Found ${newsData.length} items`);
    console.log("First item sample:", JSON.stringify(newsData[0]).substring(0, 200) + "...");
    
    // Build the channel metadata
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

    // Add items from the news data
    newsData.forEach(e => {
      const item = {
        item: {
          title: e.title || "Untitled",
          pubDate: e.date || new Date().toUTCString(),
          GUID: e.id || Math.random().toString(36).substring(2, 15),
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
      body: 'Internal Server Error: ' + error.message + '\n\nStack: ' + error.stack,
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