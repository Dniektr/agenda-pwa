export interface AgendaEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  notes?: string;
  reminders: Reminder[];
  location?: string;
  category?: EventCategory;
}

export interface Reminder {
  minutesBefore: number;
  notified?: boolean;
}

export type EventCategory =
  | 'personnel'
  | 'travail'
  | 'sante'
  | 'social'
  | 'autre';

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personnel: '#6C8EBF',
  travail: '#E8A838',
  sante: '#82C45A',
  social: '#C45AB3',
  autre: '#A0A0A0',
};
