import type { Author } from './Author';

export interface BlogPost {
  id: number;
  status: string;
  date_created: string;
  date_updated: string;
  title: string;
  date: string;
  slug: string;
  content: string;
  excerpt: string;
  Tags: string[];
  authors: Author[];
  image?: {
    id: string;
    storage: string;
    filename_disk: string;
    filename_download: string;
    title: string;
    type: string;
    [key: string]: any;
  };
  [key: string]: any;
  featuredBlog?: boolean;
}