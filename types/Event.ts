// types/Event.ts
export interface Event {
  id: number;
  title: string;
  link: string;
  featured: any | null;
  description: string;
  type: string;
  date: string;
  teaching_type: any | null;
  case_study_type: any | null;
  partner: any | null;
  speakers: any | null;
  online_event: any | null;
  inperson_event: any | null;
  stage: any | null;
  transcript: string;
  thumbnail?: {
    id: string;
    storage: string;
    filename_disk: string;
    uploaded_on: string;
  };
  partner_logo: any | null;
  transcript_file: any | null;
  event_series: any[];
  authors: any[];
  contributors: any[];
}