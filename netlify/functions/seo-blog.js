const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const axios = require("axios");

exports.handler = async (event, context) => {
  const slug = event.queryStringParameters.slug;
  const indexPath = path.join(__dirname, "../../dist/index.html");

  try {
    // Read the built index.html file
    const html = fs.readFileSync(indexPath, "utf8");

    // Fetch blog post data.
    // Update this URL to the endpoint that returns your blog post data filtered by slug.
    const response = await axios.get(
      `https://dev.thegovlab.com/items/blog?filter[slug][_eq]=${slug}`
    );
    const blogPosts = response.data.data;

    if (!blogPosts || blogPosts.length === 0) {
      return {
        statusCode: 404,
        body: "Blog post not found"
      };
    }
    
    const blog = blogPosts[0];

    // Extract meta values:
    const title = "RebootDemocracy.AI Blog | " + blog.title;
    const rawContent = blog.content || "";
    // Remove HTML tags and generate a plain text description
    const plainText = rawContent.replace(/<[^>]+>/g, "");
    const description = blog.excerpt
      ? blog.excerpt
      : plainText.substring(0, 200) + "...";
    // Assume blog.image is a URL (adjust if it’s an object)
    const ogImage = blog.image
      ? blog.image 
      : "https://dev.thegovlab.com/assets/4650f4e2-6cc2-407b-ab01-b74be4838235";

    // Load index.html via Cheerio and update meta tags
    const $ = cheerio.load(html);
    $("head title").text(title);
    $("head meta[name='description']").attr("content", description);
    $("head meta[name='title']").attr("content", title);
    $("head meta[property='og:title']").attr("content", title);
    $("head meta[property='og:description']").attr("content", description);
    $("head meta[property='og:image']").attr("content", ogImage);
    $("head meta[property='twitter:title']").attr("content", title);
    $("head meta[property='twitter:description']").attr("content", description);
    $("head meta[property='twitter:image']").attr("content", ogImage);
    $("head meta[property='twitter:card']").attr("content", "summary_large_image");

    // Optionally, add JSON‑LD structured data for better search results.
    const jsonLd = {
      "@context": "https://schema.org/",
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": description,
      "image": ogImage,
      "url": `https://rebootdemocracy.ai/blog/${slug}`
    };
    $("head").prepend(
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: $.html()
    };
  } catch (error) {
    console.error("Error in SEO function:", error);
    return {
      statusCode: 500,
      body: "Internal server error"
    };
  }
};