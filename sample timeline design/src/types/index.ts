export interface TimelineEvent {
  id: string;
  title: string;
  categoryId: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  isImportant?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  today: Date;
}

export interface Quarter {
  name: string;
  date: Date;
}