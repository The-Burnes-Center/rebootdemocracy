export function fetchPostData(slug) {
    return this.directus
      .items("reboot_democracy_weekly_news")
      .readByQuery({
        meta: "total_count",
        limit: -1,
        fields: ["*.*,items.reboot_democracy_weekly_news_items_id.*"],
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