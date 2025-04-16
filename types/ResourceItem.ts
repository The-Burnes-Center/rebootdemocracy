

export interface ResourceItem {
  id: number;
  type: string;
    thumbnail?: {
        id: string;
  };
  stage?: string[];
  partner: string;
  title: string;
  description: string;
  link: string;
}