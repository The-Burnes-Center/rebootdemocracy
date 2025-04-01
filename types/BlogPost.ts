interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  image?: {
    filename_disk: string;
    width: number;
    height: number;
  };
  audio_version?: {
    id: string;
  };
  ai_content_disclaimer?: boolean;
  authors: {
    team_id: {
      First_Name: string;
      Last_Name: string;
      Headshot?: { id: string };
      Link_to_bio?: string;
    };
  }[];
}
