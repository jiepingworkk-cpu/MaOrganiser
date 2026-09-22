import { parseDateLocal, differenceInCalendarDays, today } from "./dates";

export type UrgencyLevel =
  | "overdue" // เลยกำหนด
  | "critical" // ครบกำหนดวันนี้ (≤24 ชม.)
  | "urgent" // เหลือ 1–3 วัน
  | "soon" // เหลือ 4–7 วัน
  | "normal" // เหลือ >7 วัน
  | "none" // ไม่มีกำหนด
  | "done"; // เสร็จแล้ว

export function getUrgency(
  dueDate?: string | null,
  done = false
): UrgencyLevel {
  if (done) return "done";
  if (!dueDate) return "none";
  const days = differenceInCalendarDays(parseDateLocal(dueDate), today());
  if (days < 0) return "overdue";
  if (days === 0) return "critical";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}

export interface UrgencyMeta {
  label: string;
  /** main chip/badge text color */
  text: string;
  /** soft background for badges */
  bg: string;
  /** border / accent */
  border: string;
  /** left accent bar color */
  bar: string;
  /** solid dot color */
  dot: string;
  /** sort weight: larger = more urgent */
  weight: number;
  /** tailwind classes ready to use */
  cls: string;
}

export const URGENCY: Record<UrgencyLevel, UrgencyMeta> = {
  overdue: {
    label: "เลยกำหนด",
    text: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900",
    bar: "bg-red-600",
    dot: "#dc2626",
    weight: 6,
    cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  critical: {
    label: "วันนี้!",
    text: "text-red-600 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900",
    bar: "bg-red-500",
    dot: "#f43f5e",
    weight: 5,
    cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  },
  urgent: {
    label: "เร่งด่วน",
    text: "text-orange-600 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-900",
    bar: "bg-orange-500",
    dot: "#f97316",
    weight: 4,
    cls: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
  },
  soon: {
    label: "ใกล้ถึง",
    text: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    bar: "bg-amber-400",
    dot: "#f59e0b",
    weight: 3,
    cls: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  },
  normal: {
    label: "มีเวลา",
    text: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    bar: "bg-emerald-500",
    dot: "#10b981",
    weight: 2,
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  },
  none: {
    label: "ไม่มีกำหนด",
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    bar: "bg-slate-300",
    dot: "#94a3b8",
    weight: 1,
    cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  done: {
    label: "เสร็จแล้ว",
    text: "text-slate-400 dark:text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-800",
    border: "border-slate-100 dark:border-slate-800",
    bar: "bg-transparent",
    dot: "#cbd5e1",
    weight: 0,
    cls: "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
  },
};

const PRIORITY_WEIGHT: Record<string, number> = { high: 0, medium: 1, low: 2 };

export interface SortableTask {
  dueDate?: string | null;
  done: boolean;
  priority: string;
  createdAt?: string;
}

/**
 * เรียงงานตามความด่วน: เลยกำหนด → วันนี้ → เร่ง → ใกล้ → มีเวลา → ไม่มีกำหนด → เสร็จ
 * ภายในช่วงเดียวกัน งาน priority สูงมาก่อน แล้วตามด้วยวันที่กำหนดส่งเร็วสุด
 */
export function compareUrgency(a: SortableTask, b: SortableTask): number {
  const wa = URGENCY[getUrgency(a.dueDate, a.done)].weight;
  const wb = URGENCY[getUrgency(b.dueDate, b.done)].weight;
  if (wa !== wb) return wb - wa;
  const pw = PRIORITY_WEIGHT[a.priority] ?? 1;
  const pw2 = PRIORITY_WEIGHT[b.priority] ?? 1;
  if (pw !== pw2) return pw - pw2;
  const da = a.dueDate ?? "\uFFFF";
  const db = b.dueDate ?? "\uFFFF";
  if (da !== db) return da.localeCompare(db);
  const ca = a.createdAt ?? "";
  const cb = b.createdAt ?? "";
  return ca.localeCompare(cb);
}

/** จำนวนวันที่เหลือ (ติดลบถ้าเลยกำหนด) หรือ null */
export function daysUntil(dueDate: string): number {
  return differenceInCalendarDays(parseDateLocal(dueDate), today());
}