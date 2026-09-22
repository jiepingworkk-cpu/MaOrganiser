import type { Category } from "./types";

export const EVENT_PRESETS: Category[] = [
  { id: "work", name: "งาน", color: "#3b82f6", scope: "event", preset: true },
  { id: "compet-academic", name: "แข่งวิชาการ", color: "#8b5cf6", scope: "event", preset: true },
  { id: "compet-sport", name: "แข่งกีฬา", color: "#10b981", scope: "event", preset: true },
  { id: "compet-art", name: "แข่งศิลปะ-ดนตรี", color: "#ec4899", scope: "event", preset: true },
  { id: "homework", name: "การบ้าน", color: "#f59e0b", scope: "event", preset: true },
  { id: "reading", name: "อ่านหนังสือ", color: "#06b6d4", scope: "event", preset: true },
  { id: "appointment", name: "นัด", color: "#64748b", scope: "event", preset: true },
];

export const SUBJECT_PRESETS: Category[] = [
  { id: "sub-thai", name: "ภาษาไทย", color: "#ef4444", scope: "subject", preset: true },
  { id: "sub-math", name: "คณิตศาสตร์", color: "#3b82f6", scope: "subject", preset: true },
  { id: "sub-physics", name: "ฟิสิกส์", color: "#8b5cf6", scope: "subject", preset: true },
  { id: "sub-chem", name: "เคมี", color: "#10b981", scope: "subject", preset: true },
  { id: "sub-bio", name: "ชีววิทยา", color: "#14b8a6", scope: "subject", preset: true },
  { id: "sub-english", name: "ภาษาอังกฤษ", color: "#f59e0b", scope: "subject", preset: true },
  { id: "sub-social", name: "สังคมศึกษา", color: "#ec4899", scope: "subject", preset: true },
  { id: "sub-history", name: "ประวัติศาสตร์", color: "#a855f7", scope: "subject", preset: true },
  { id: "sub-computer", name: "คอมพิวเตอร์", color: "#06b6d4", scope: "subject", preset: true },
  { id: "sub-other", name: "วิชาอื่นๆ", color: "#64748b", scope: "subject", preset: true },
];

export const PRESET_BY_ID = new Map<string, Category>(
  [...EVENT_PRESETS, ...SUBJECT_PRESETS].map((c) => [c.id, c])
);

/** Merge presets + custom categories from Firestore (custom wins on same id). */
export function mergeCategories(custom: Category[]): Category[] {
  const map = new Map<string, Category>();
  for (const c of PRESET_BY_ID.values()) map.set(c.id, c);
  for (const c of custom) map.set(c.id, c);
  return [...map.values()];
}

export function categoriesByScope(
  all: Category[],
  scope: "event" | "subject"
): Category[] {
  return all.filter((c) => c.scope === scope);
}

export function findCategory(all: Category[], id?: string | null): Category | null {
  if (!id) return null;
  return all.find((c) => c.id === id) ?? null;
}

export const PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
  "#14b8a6",
  "#a855f7",
  "#64748b",
  "#f97316",
  "#22c55e",
];

export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}