// types/Author.ts
export interface Author {
  id: number;
  blog_id: number;
  team_id: {
    id: number;
    First_Name: string;
    Last_Name: string;
    Title: string;
    Link_to_bio: string;
    Headshot?: {
      id: string;
      filename_disk: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

