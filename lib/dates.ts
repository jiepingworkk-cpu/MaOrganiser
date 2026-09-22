import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  differenceInCalendarDays,
  addMonths,
  isSameDay,
  isSameMonth,
  isPast,
  startOfDay,
} from "date-fns";
import { enUS, th } from "date-fns/locale";
import type { Locale as DateLocale } from "date-fns";

let currentLocale: DateLocale = th;

/** เรียกจาก LocaleProvider เพื่อสลับภาษาในการจัดรูปแบบวันที่ (ไทย/อังกฤษ) */
export function setDateLocale(locale: "th" | "en") {
  currentLocale = locale === "en" ? enUS : th;
}

export const today = () => startOfDay(new Date());

/** yyyy-MM-dd (local) — เก็บใน Firestore และ input date */
export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** แปลง "yyyy-MM-dd" ให้เป็น Date ที่เวลาเที่ยงคืนตาม local timezone */
export function parseDateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatLocal(d: Date, pattern: string): string {
  return format(d, pattern, { locale: currentLocale });
}

export function formatDateShort(s: string): string {
  return format(parseDateLocal(s), "d MMM", { locale: currentLocale });
}

export function formatDateLong(s: string): string {
  return format(parseDateLocal(s), "EEEE d MMMM yyyy", { locale: currentLocale });
}

export function monthLabel(date: Date): string {
  return format(date, "MMMM yyyy", { locale: currentLocale });
}

/** 7 วันของสัปดาห์ที่ประกอบด้วย date (เริ่ม จันทร์) */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const out: Date[] = [];
  let c = start;
  while (c <= end) {
    out.push(c);
    c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1);
  }
  return out;
}

/** กริดของเดือน: 42 cells (6 สัปดาห์ เริ่มจันทร์) เพื่อให้ grid สูงคงที่ */
export function monthGrid(date: Date): Date[] {
  const first = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }
  return cells;
}

export {
  addMonths,
  isSameDay,
  isSameMonth,
  isPast,
  differenceInCalendarDays,
  startOfMonth,
};