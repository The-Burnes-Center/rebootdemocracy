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
  id: number;
  innovate_us_instructors_id: {
    id: number;
    name: string;
    title_and_affiliation: string;
    bio: string;
    link_to_bio: string;
    headshot: {
      id: string;
      filename_disk: string;
    };
  };
}

export interface WorkshopInstructor {
  id: number;
  innovate_us_workshops_id: number;
  innovate_us_instructors_id: {
    id: number;
    name: string;
    title_and_affiliation: string;
    bio: string;
    link_to_bio: string;
    headshot: {
      id: string;
      filename_disk: string;
      storage: string;
      uploaded_on: string;
    };
  };
}

export interface Workshop {
  id: number;
  title: string;
  description: string;
  date: string;
  link: string;
  sign_up_link: string;
  registrants?: string;
  thumbnail?: {
    id: string;
    storage: string;
    filename_disk: string;
    uploaded_on: string;
  };
  instructor?: WorkshopInstructor[];
  online_event?: boolean;
  inperson_event?: boolean;
  speakers?: string;
  partner_logo?: {
    id: string;
    storage: string;
    filename_disk: string;
  };
}

export interface EventItem {
  event_element: Event;
  series_name: string;
}