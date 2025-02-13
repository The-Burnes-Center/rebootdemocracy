// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
import pkg  from 'jstoxml';
import { Directus } from '@directus/sdk';

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
    {_name: "atom:link",
        _attrs: {
        href: 'https://rebootdemocracy.ai/feed/rss',
        rel: 'self',
        type: 'application/rss+xml',
    }
}
]

const publicData = await blogPAW.readByQuery(
    {
        filter: {
            _and: [ { date: { _lte: "$NOW(-5 hours)" }},
            {
               status: {
              _eq: "published"
              
            },
            }
            ],
          },
        limit: -1,
        fields: ["*.*"]
})

publicData.data.map(e=>{
            if(e.status == "published")
            {
            var itemcont = {};
            itemcont["item"] = {};
            itemcont["item"]["title"] =e.title;
            itemcont["item"]["link"] ="https://rebootdemocracy.ai/blog/"+e.slug;
            itemcont["item"]["guid"] ="https://rebootdemocracy.ai/blog/"+e.slug;
            
            // const fi = e.featured_image ? e.featured_image.filename_disk: "d1c6553e-bcdc-4019-b3a7-e6376c294eec.png"
            itemcont["item"]["description"] =e.content;
            
            itemcont["item"]["pubDate"] =buildRFC822Date(e.date);
            channel.push(itemcont);
            }
        })

        const xmlOptions = {

            header: true,
            contentReplacements: {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&apos;',
                '&': '&amp;',
                '&ldquo;': '"',
                '&lsquo;': "'",
                '&rsquo;': "'",
                '&rdquo;': '"',
                '&nbsp;': ' ',
                '&ndash;': '-',
                '&mdash;': '-',
                '&hellip;': "...",
                '&thinsp;': ' ',
                '&aacute;': 'á',
                '&eacute;': 'é',
                '&iacute;': 'í',
                '&oacute;': 'ó',
                '&uacute;': 'ú',
                '&agrave;': 'à',
                '&egrave;': 'è',
                '&igrave;': 'ì',
                '&ograve;': 'ò',
                '&ugrave;': 'ù',
                '&auml;': 'ä',
                '&euml;': 'ë',
                '&iuml;': 'ï',
                '&ouml;': 'ö',
                '&uuml;': 'ü',
                '&acirc;': 'â',
                '&ecirc;': 'ê',
                '&icirc;': 'î',
                '&ocirc;': 'ô',
                '&ucirc;': 'û',
                '&AElig;': 'Æ',
                '&aelig;': 'æ',
                '&oelig;': 'œ',
                '&iexcl;': '¡',
                '&ntilde;': 'ñ'
            },
            indent: '  '
        };
        
        const rssFeed = toXML(
            {
                _name: 'rss',
                _attrs: {
                    version: '2.0',
                    ["xmlns:atom"]: 'http://www.w3.org/2005/Atom'
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
// Time converter from ISO to UTC
function addLeadingZero(num) {
    num = num.toString();
    while (num.length < 2) num = "0" + num;
    return num;
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
  
    //Wed, 02 Oct 2002 13:00:00 GMT
    return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
  }
  };
