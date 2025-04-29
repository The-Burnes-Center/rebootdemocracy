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

const directus = createDirectus('https://content.thegovlab.com/').with(rest());

exports.handler = async function (event, context) {
  try {
    // Initialize the jstoxml module
    const toXML = await initializeJsToXml();
    
    console.log("Attempting to fetch data from Directus...");
    
    const publicData = await directus.request(
      readItems("reboot_democracy_weekly_news", {
        filter: {
          _and: [
            {
              status: {
                _eq: "published"
              }
            }
          ],
        },
        sort: ['-id'],  // Changed to array format for sort
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"]
      })
    );
    
    console.log("Data retrieved, checking structure...");
    
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
    
    if (!newsData || newsData.length === 0) {
      console.log("No data found in response");
      return {
        statusCode: 404,
        body: 'No news data found.',
      };
    }
    
    console.log(`Found ${newsData.length} news items`);
    
    // Start building the RSS channel
    const channel = [
      {
        title: newsData[0].title || "Reboot Democracy Weekly News"
      },
      {
        description: newsData[0].summary || "Weekly news updates"
      },
      {
        link: 'https://rebootdemocracy.ai'
      },
      {
        lastBuildDate: () => new Date().toUTCString()
      },
      {
        pubDate: () => new Date().toUTCString()
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
    if (newsData[0].items && Array.isArray(newsData[0].items)) {
      console.log(`Processing ${newsData[0].items.length} sub-items`);
      
      newsData[0].items.forEach(e_items => {
        const newsItem = e_items.reboot_democracy_weekly_news_items_id;
        
        if (newsItem) {
          const itemcont = {
            item: {
              title: newsItem.title || "Untitled",
              pubDate: newsItem.date || new Date().toUTCString(),
              author: `${newsItem.author || 'Unknown'} in ${newsItem.publication || 'Unknown Publication'}`,
              link: newsItem.url || 'https://rebootdemocracy.ai',
              description: newsItem.excerpt || '',
              category: newsItem.category || 'News',
            }
          };
          channel.push(itemcont);
        }
      });
    } else {
      console.log("Warning: No items array found in the first news entry");
    }

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
      body: 'Internal Server Error: ' + error.message + '\n\nStack: ' + error.stack,
    };
  }
};