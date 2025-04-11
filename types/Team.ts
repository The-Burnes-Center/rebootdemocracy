// types/Team.ts
export interface Team {
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
}

