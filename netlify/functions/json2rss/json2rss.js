// This function converts reboot blog posts (from the "reboot_democracy_blog" collection)
// to an RSS feed and optionally filters by a provided ?id= parameter.
const { toXML } = require('jstoxml');
const { Directus } = require('@directus/sdk');

exports.handler = async function (event, context) {
  // Create a Directus instance. Change the API endpoint if necessary.
  const directus = new Directus('https://content.thegovlab.com/');
  const blogReboot = directus.items("reboot_democracy_blog");

  // Define the channel metadata for the RSS feed.
  var channel = [
    { title: 'Reboot Democracy' },
    {
      description:
        'Latest articles on governance, democracy, and public policy.'
    },
    { link: 'https://rebootdemocracy.ai/blog' },
    { lastBuildDate: () => (new Date()).toUTCString() },
    { pubDate: () => (new Date()).toUTCString() },
    { language: 'en' },
    {
      _name: "atom:link",
      _attrs: {
        href: 'https://rebootdemocracy.ai/blog/feed/rss',
        rel: 'self',
        type: 'application/rss+xml'
      }
    }
  ];

  // Build filter conditions:
  // 1. Only show posts with a publication date (using the "date" field) on or before now (minus 5 hours)
  // 2. Only published posts.
  // 3. Optionally, only show a specific post if ?id is provided.
  let filterConditions = [
    { date: { _lte: "$NOW(-5 hours)" } },
    { status: { _eq: "published" } }
  ];

  if (event.queryStringParameters && event.queryStringParameters.id) {
    filterConditions.push({
      id: { _eq: Number(event.queryStringParameters.id) }
    });
  }

  // Fetch the blog posts
  const publicData = await blogReboot.readByQuery({
    filter: {
      _and: filterConditions
    },
    limit: -1,
    fields: ["*.*"]
  });

  // Process each blog post to build an RSS item.
  publicData.data.forEach(e => {
    var itemCont = {
      item: {
        title: e.title,
        link:
          e.fullURL || ("https://rebootdemocracy.ai/blog/" + e.slug),
        guid:
          e.fullURL || ("https://rebootdemocracy.ai/blog/" + e.slug),
        description: (() => {
          const fi = (e.image && e.image.filename_disk) ? e.image.filename_disk : "default.jpg";
          return '<![CDATA[<img src="https://content.thegovlab.com/assets/' + fi +
            '"/> ' + e.content + ']]>';
        })(),
        pubDate: buildRFC822Date(e.date)
      }
    };
    channel.push(itemCont);
  });

  // XML options for a nicely formatted and compliant RSS feed.
  const xmlOptions = {
    header: true,
    contentReplacements: {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
      '&': '&amp;'
    },
    indent: '  '
  };

  // Convert the JSON structure to XML.
  const rssFeed = toXML(
    {
      _name: 'rss',
      _attrs: {
        version: '2.0',
        ["xmlns:atom"]: 'http://www.w3.org/2005/Atom'
      },
      _content: {
        channel: channel
      }
    },
    xmlOptions
  );

  return {
    statusCode: 200,
    body: rssFeed,
  };

  // Helper function: adds a leading zero to a number, if needed.
  function addLeadingZero(num) {
    num = num.toString();
    while (num.length < 2) num = "0" + num;
    return num;
  }
  
  // Converts an ISO date string to RFC822 format for the RSS pubDate element.
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
    const timezone = date.getTimezoneOffset() === 0 ? "GMT" : "BST"; // Adjust as needed.
    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  }
};