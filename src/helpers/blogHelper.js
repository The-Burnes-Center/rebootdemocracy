export function fetchBlogData(slug) {
  
  const nowOffset = getDirectusNowOffset(); // "$NOW(-4 hours)" or "$NOW(-5 hours)"

    return this.directus
      .items("reboot_democracy_blog")
      .readByQuery({
        meta: "total_count",
        limit: -1,
        fields: [
          "*.*",
          "authors.team_id.*",
          "authors.team_id.Headshot.*",
          "image.*"
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
            { date: { _lte: nowOffset } },
          ],
        },
      });
  }

  function isEasternDST(date) {
    const year = date.getFullYear();
  
    // Calculate DST start: Second Sunday in March at 2:00 AM ET
    const march = new Date(year, 2, 1); // March 1st
    const firstSundayMarch = 7 - march.getDay();
    const secondSundayMarch = firstSundayMarch + 7;
    const dstStart = new Date(year, 2, secondSundayMarch, 2); // 2:00 AM
  
    // Calculate DST end: First Sunday in November at 2:00 AM ET
    const november = new Date(year, 10, 1); // November 1st
    const firstSundayNovember = november.getDay() === 0 ? 1 : (1 + (7 - november.getDay()));
    const dstEnd = new Date(year, 10, firstSundayNovember, 2); // 2:00 AM
  
    return date >= dstStart && date < dstEnd;
  }
  function    getDirectusNowOffset() {
    const now = new Date();
    return isEasternDST(now) ? '$NOW(-4 hours)' : '$NOW(-5 hours)';
  }

  