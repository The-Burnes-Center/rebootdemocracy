
// Types
export interface NewsItem {
  author?: string;
  excerpt?: string;
  category?: string;
  title?: string;
  date?: string;
  id?: number;
  url: string;
}

export interface RawSearchResultItem {
  objectID: string;
  title?: string;
  excerpt?: string;
  slug?: string;
  type?: string;
  category?: string;
  Tags?: string[];
  author?: string;
  authors?: Array<{
    name?: string;
    team_id?: {
      First_Name?: string;
      Last_Name?: string;
    }
  }>;
  image?: string;
  _sourceIndex?: string;
  date?: string | null;
  edition?: string;
  item?: NewsItem;
  summary?: string;
}
