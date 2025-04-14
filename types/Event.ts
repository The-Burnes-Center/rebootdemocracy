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
  event_series: Array<{
    general_events_series_id?: {
      title?: string;
      description?: string;
      full_description?: string;
    };
  }>;
  authors: any[];
  contributors: any[];
  instructor?: Instructor[];
}

export interface Thumbnail {
  id: string;
  storage: string;
  filename_disk: string;
  uploaded_on: string;
}

export interface GeneralEventsSeries {
  id: string;
  title: string;
  description: string;
  full_description: string;
}

export interface Instructor {
  innovate_us_instructors_id: {
    headshot: {
      id: string;
    };
  };
}

export interface EventItem {
  event_element: Event;
  series_name: string;
}