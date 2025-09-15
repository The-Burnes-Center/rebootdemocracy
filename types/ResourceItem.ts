

export interface ResourceItem {
  id: number;
  type: string;
  case_study_type: string; 
    thumbnail?: {
      id: string;
      filename_disk: string;
  };
  stage?: string[];
  partner: string;
  title: string;
  description: string;
  link: string;
}