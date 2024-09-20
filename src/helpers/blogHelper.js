export function fetchBlogData(slug) {
    return this.directus
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
              }
            }
          ]
        }
      });
  }
