// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg from 'jstoxml';
import { Directus } from '@directus/sdk';
import he from 'he';

exports.handler = async function (event, context) {

  const { toXML } = pkg;
  const directus = new Directus('https://content.thegovlab.com/');
  const blogPAW = directus.items("reboot_democracy_weekly_news");
  const publicData = await blogPAW.readByQuery({
    filter: {
      _and: [
        {
          status: {
            _eq: "published"
          },
        }
      ],
    },
    limit: -1,
    sort: '-id',
    fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"]
  });


  var channel = [
    {
      title:  publicData.data[0].title
    },
    {
      description: publicData.data[0].summary
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



  publicData.data.map(e =>{
    
    var itemcont = {};
    itemcont["item"] = {};
    itemcont["item"]["title"] = e.title;
    itemcont["item"]["pubDate"] = e.date;
    itemcont["item"]["GUID"] = e.id;
    channel.push(itemcont);
  
  })
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
    body: rssFeed,
  };

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
    const timezone = date.getTimezoneOffset() === 0 ? "GMT" : "BST";

    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  }
};