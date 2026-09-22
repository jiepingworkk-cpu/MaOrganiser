export type Priority = "high" | "medium" | "low";

export type CategoryScope = "event" | "subject";

export interface Category {
  id: string;
  name: string;
  color: string;
  scope: CategoryScope;
  preset?: boolean;
}

export interface AppEvent {
  id: string;
  title: string;
  categoryId: string;
  /** ISO date-only string "yyyy-MM-dd" (local time) */
  date: string;
  allDay: boolean;
  note?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  categoryId?: string;
  priority: Priority;
  /** ISO date-only string "yyyy-MM-dd" or null */
  dueDate?: string | null;
  done: boolean;
  note?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  subjectId?: string;
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Reading {
  id: string;
  subject: string;
  color?: string;
  currentChapter: number;
  totalChapters?: number | null;
  /** optional manual percent override (0-100) */
  percent?: number | null;
  /** ISO date-only "yyyy-MM-dd" */
  targetDate?: string | null;
  /** ISO date-only "yyyy-MM-dd" */
  startDate: string;
  updatedAt: string;
  createdAt: string;
}

export interface Device {
  token: string;
  lastSeen?: number;
}