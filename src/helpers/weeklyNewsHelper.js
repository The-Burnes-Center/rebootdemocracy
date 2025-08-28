export function fetchPostData(slug) {
  
    return this.directus
      .items("reboot_democracy_weekly_news")
      .readByQuery({
        meta: "total_count",
        limit: -1,
        fields: ["*.*",
                "image.*",
                "items.reboot_democracy_weekly_news_items_id.*",
                "items.reboot_democracy_weekly_news_items_id.related_links.*",
                "items.reboot_democracy_weekly_news_items_id.related_links.reboot_weekly_news_related_news_id.*"],
        filter: {
          _and: [
            {
              edition: {
                _eq: slug,
              },
            },
            {
              status: {
                _eq: "published",
              },
            }
          ],
        },
      });
  }