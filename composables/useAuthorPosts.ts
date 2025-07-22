// composables/useAuthorPosts.ts
import type { BlogPost, WeeklyNews } from '@/types/index.ts';
import { fetchAllBlogPosts } from './fetchBlogData';
import { fetchWeeklyNewsEntries } from './fetchWeeklyNews';

// Cache for author posts to avoid repeated API calls
const authorPostsCache = new Map<string, any[]>();

/**
 * Extracts author names from a blog post with junction table structure
 */
function extractBlogAuthors(post: BlogPost): string[] {
  const authors: string[] = [];
  
  if (post.authors && Array.isArray(post.authors)) {
    post.authors.forEach((authorObj: any) => {
      if (authorObj?.team_id?.First_Name && authorObj?.team_id?.Last_Name) {
        authors.push(`${authorObj.team_id.First_Name} ${authorObj.team_id.Last_Name}`);
      }
    });
  }
  
  return authors;
}

/**
 * Extracts author names from a string field (used in weekly news)
 */
function extractStringAuthors(authorString: string): string[] {
  if (!authorString || typeof authorString !== 'string') return [];
  
  // Split by common separators and clean up
  return authorString
    .split(/[,&]|(\sand\s)/i)
    .map(author => author.trim())
    .filter(author => author && author.toLowerCase() !== 'and');
}

/**
 * Checks if a search term matches any author in the list
 */
function matchesAuthor(authors: string[], searchTerm: string): boolean {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return authors.some(author => {
    const normalizedAuthor = author.toLowerCase();
    // Check both ways: partial match in either direction
    return normalizedAuthor.includes(normalizedSearch) || 
           normalizedSearch.includes(normalizedAuthor);
  });
}

/**
 * Transform a blog post to include all necessary fields
 */
function transformBlogPost(post: BlogPost): any {
  return {
    ...post,
    type: 'blog',
    authors: extractBlogAuthors(post) // Store extracted authors for efficiency
  };
}

/**
 * Transform a weekly news entry to match blog structure
 */
function transformWeeklyNews(entry: WeeklyNews): any {
  return {
    type: 'news',
    id: entry.id,
    title: entry.title,
    excerpt: entry.summary,
    authors: extractStringAuthors(entry.author || ''), // Store as array for consistency
    authorString: entry.author, // Keep original string
    date: entry.date,
    edition: entry.edition,
    slug: null,
    image: entry.image,
    status: entry.status,
    Tags: ['News that Caught Our Eye'],
    category: 'News that Caught Our Eye'
  };
}

/**
 * Fetches all posts (blog posts and weekly news) by a specific author
 */
export async function fetchPostsByAuthor(authorName: string): Promise<any[]> {
  // Check cache first
  if (authorPostsCache.has(authorName)) {
    return authorPostsCache.get(authorName) || [];
  }

  try {
    // Fetch both data sources in parallel
    const [blogPosts, weeklyNewsEntries] = await Promise.all([
      fetchAllBlogPosts(),
      fetchWeeklyNewsEntries()
    ]);

    // Transform all posts once
    const transformedBlogs = blogPosts.map(transformBlogPost);
    const transformedNews = weeklyNewsEntries.map(transformWeeklyNews);

    // Filter posts by author
    const matchingBlogs = transformedBlogs.filter(post => 
      matchesAuthor(post.authors, authorName)
    );
    
    const matchingNews = transformedNews.filter(entry => 
      matchesAuthor(entry.authors, authorName)
    );

    // Combine and sort by date
    const allAuthorPosts = [...matchingBlogs, ...matchingNews]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Cache the results
    authorPostsCache.set(authorName, allAuthorPosts);
    
    return allAuthorPosts;
  } catch (error) {
    console.error(`Error fetching posts for author ${authorName}:`, error);
    return [];
  }
}

/**
 * Helper function to format author names for display
 */
export function getAuthorName(post: any): string {
  // If we already have extracted authors array (from our transforms)
  if (post.authors && Array.isArray(post.authors) && typeof post.authors[0] === 'string') {
    const authors = post.authors;
    if (authors.length === 0) return 'Reboot Democracy Team';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    
    const lastAuthor = authors[authors.length - 1];
    const otherAuthors = authors.slice(0, -1);
    return `${otherAuthors.join(', ')} and ${lastAuthor}`;
  }
  
  // For original blog post structure
  if (post.authors && Array.isArray(post.authors) && post.authors[0]?.team_id) {
    const authors = extractBlogAuthors(post);
    if (authors.length === 0) return 'Reboot Democracy Team';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    
    const lastAuthor = authors[authors.length - 1];
    const otherAuthors = authors.slice(0, -1);
    return `${otherAuthors.join(', ')} and ${lastAuthor}`;
  }
  
  // For weekly news with author string
  if (post.authorString || post.author) {
    return post.authorString || post.author;
  }
  
  return 'Reboot Democracy Team';
}

/**
 * Gets a list of all unique authors from both collections
 */
export async function getAllAuthors(): Promise<string[]> {
  try {
    const [blogPosts, weeklyNewsEntries] = await Promise.all([
      fetchAllBlogPosts(),
      fetchWeeklyNewsEntries()
    ]);

    const authorSet = new Set<string>();

    // Extract from blog posts
    blogPosts.forEach(post => {
      const authors = extractBlogAuthors(post);
      authors.forEach(author => {
        if (author && author !== 'Reboot Democracy Team') {
          authorSet.add(author);
        }
      });
    });

    // Extract from weekly news
    weeklyNewsEntries.forEach(entry => {
      const authors = extractStringAuthors(entry.author || '');
      authors.forEach(author => {
        if (author && author !== 'Reboot Democracy Team') {
          authorSet.add(author);
        }
      });
    });

    return Array.from(authorSet).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error getting all authors:', error);
    return [];
  }
}

/**
 * Search posts with partial author name matching
 */
export async function searchPostsByAuthor(searchTerm: string): Promise<any[]> {
  try {
    return fetchPostsByAuthor(searchTerm);
  } catch (error) {
    console.error(`Error searching posts by author "${searchTerm}":`, error);
    return [];
  }
}

export function clearAuthorPostsCache(): void {
  authorPostsCache.clear();
}