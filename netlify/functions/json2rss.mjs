// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import { createDirectus, rest, readItems } from '@directus/sdk';
import he from 'he';

export const handler = async function (event, context) {
  // Dynamically import jstoxml
  const jstoxmlModule = await import('jstoxml');
  const { toXML } = jstoxmlModule.default;
  
  // Create Directus client with the new SDK format
  const directus = createDirectus('https://burnes-center.directus.app/')
    .with(rest());


  var channel = [
    {
      title: 'Reboot Democracy Blog'
    },
    {
      description: 'The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.'
    },
    {
      link: 'https://rebootdemocracy.ai'
    },
    {
      lastBuildDate: () => (new Date).toUTCString()
    },
    {
      pubDate: () => (new Date).toUTCString()
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

  try {
    const publicData = await directus.request(
      readItems('reboot_democracy_blog', {
        filter: {
          _and: [
            { date: { _lte: "$NOW" } },
            {
              status: {
                _eq: "published"
              },
            }
          ],
        },
        limit: -1,
        fields: ["*.*", "authors.team_id.*",]
      })
    );


  publicData.map((e) => {
    if (e.status === "published") {
      let itemcont = {};
      itemcont["item"] = {};
      itemcont["item"]["title"] = decodeEntities(e.title);
      itemcont["item"]["link"] = "https://rebootdemocracy.ai/blog/" + e.slug;
      itemcont["item"]["guid"] = "https://rebootdemocracy.ai/blog/" + e.slug;
      itemcont["item"]["pubDate"] = buildRFC822Date(e.date);

      // Construct author line
      let authorNames = "";
      if (e.authors && Array.isArray(e.authors) && e.authors.length > 0) {
        authorNames = "By " + e.authors
          .map(author => `${author.team_id.First_Name} ${author.team_id.Last_Name}`)
          .join(", ") + "<br/>";
      }

      // Handle image and content
      if (e.image && e.image.id) {
        let imageUrl = 'https://burnes-center.directus.app/assets/' + e.image.id + '?width=400&quality=70&format=jpg';

        itemcont["item"]["enclosure"] = {
          _attrs: {
            url: imageUrl,
            type: "image/jpeg"
          }
        };

        itemcont["item"]["media:content"] = {
          _attrs: {
            url: imageUrl,
            type: "image/jpeg",
            medium: "image"
          }
        };

        itemcont["item"]["description"] = `<![CDATA[<img src="${imageUrl}" alt="${e.title}" /><br/>${authorNames}${decodeEntities(e.content)}]]>`;
      } else {
        itemcont["item"]["description"] = `<![CDATA[${authorNames}${decodeEntities(e.content)}]]>`;
      }

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
    console.error('Error generating RSS feed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate RSS feed' })
    };
  }

  // Helper functions

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
    
    // Properly handle timezone offset
    let offset = date.getTimezoneOffset();
    let timezone;
    if (offset === 0) {
      timezone = "GMT";
    } else {
      const hours = Math.abs(Math.floor(offset / 60));
      const minutes = Math.abs(offset % 60);
      timezone = (offset < 0 ? "+" : "-") + 
                addLeadingZero(hours) + 
                (minutes ? addLeadingZero(minutes) : "00");
    }

    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  }
};