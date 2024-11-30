// blogHelper.js
//import { Directus } from '@directus/sdk';

export function fetchBlogData(directus, slug) {
  return directus
    .items("reboot_democracy_blog")
    .readByQuery({
      meta: "total_count",
      limit: -1,
      fields: [
        "*.*",
        "authors.team_id.*",
        "authors.team_id.Headshot.*"
      ],
      filter: {
        _and: [
          {
            slug: {
              _eq: slug,
            },
          },
          {
            status: {
              _eq: "published",
            },
          },
        ],
      },
    });
}