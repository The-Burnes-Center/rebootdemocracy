// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg from 'jstoxml';
import { Directus } from '@directus/sdk';
import he from 'he';

exports.handler = async function (event, context) {

  const { toXML } = pkg;
  const directus = new Directus('https://content.thegovlab.com/');
  const blogPAW = directus.items("reboot_democracy_blog");


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

  const publicData = await blogPAW.readByQuery({
    filter: {
      _and: [
        { date: { _lte: "$NOW(-5 hours)" } },
        {
          status: {
            _eq: "published"
          },
        }
      ],
    },
    limit: -1,
    fields: ["*.*", "authors.team_id.*",]
  });


  publicData.data.map((e) => {
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
        let imageUrl = 'https://content.thegovlab.com/assets/' + e.image.id + '?width=400&quality=40&format=jpg';

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
