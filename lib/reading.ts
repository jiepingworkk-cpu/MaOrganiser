import type { Reading } from "./types";
import { parseDateLocal, differenceInCalendarDays, today } from "./dates";

/** เปอร์เซ็นต์ที่ใช้จริง: manual override หากมี ไม่งั้นคำนวณจากบท */
export function readingPercent(r: Reading): number {
  if (r.percent != null && r.percent >= 0) return Math.min(100, r.percent);
  if (r.totalChapters && r.totalChapters > 0) {
    return Math.min(100, Math.round((r.currentChapter / r.totalChapters) * 100));
  }
  return 0;
}

export type ReadingStatusKey =
  | "done"
  | "behind"
  | "overtarget"
  | "ontrack"
  | "reading";

export interface ReadingProgressInfo {
  percent: number;
  behind: boolean;
  done: boolean;
  statusKey: ReadingStatusKey;
  expectedPercent: number | null;
  daysLeft: number | null;
  chapterCurrent: number;
  chapterTotal: number | null;
}

/** ตรวจว่า "ตามหลังแผน" หรือไม่ เทียบกับเวลาที่ผ่านไปจนถึงวันเป้าหมาย */
export function readingInfo(r: Reading): ReadingProgressInfo {
  const percent = readingPercent(r);
  const done = percent >= 100;

  let behind = false;
  let expectedPercent: number | null = null;
  let daysLeft: number | null = null;

  if (r.targetDate && r.startDate) {
    const total = differenceInCalendarDays(
      parseDateLocal(r.targetDate),
      parseDateLocal(r.startDate)
    );
    const elapsed = differenceInCalendarDays(
      today(),
      parseDateLocal(r.startDate)
    );
    daysLeft = differenceInCalendarDays(
      parseDateLocal(r.targetDate),
      today()
    );
    if (total > 0) {
      expectedPercent = Math.min(
        100,
        Math.max(0, Math.round((elapsed / total) * 100))
      );
      behind = percent < expectedPercent - 5;
    }
  }

  const chapterTotal = r.totalChapters && r.totalChapters > 0 ? r.totalChapters : null;
  const chapterCurrent = Math.min(r.currentChapter, chapterTotal ?? r.currentChapter);

  let statusKey: ReadingStatusKey;
  if (done) statusKey = "done";
  else if (r.targetDate && behind) statusKey = "behind";
  else if (r.targetDate && (daysLeft ?? 0) <= 0) statusKey = "overtarget";
  else if (r.targetDate) statusKey = "ontrack";
  else statusKey = "reading";

  return { percent, behind, done, expectedPercent, daysLeft, statusKey, chapterCurrent, chapterTotal };
}

export function progressBarClass(info: ReadingProgressInfo): string {
  if (info.done) return "bg-slate-400";
  if (info.behind) return "bg-red-500";
  return "bg-emerald-500";
}