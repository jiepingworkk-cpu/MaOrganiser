"use client";

import { useMemo, useState } from "react";
import { Plus, Pin, Search, StickyNote } from "lucide-react";
import { useCollection } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import { formatLocal } from "~/lib/dates";
import { mergeCategories, categoriesByScope, findCategory } from "~/lib/categories";
import type { Note, Category } from "~/lib/types";
import NoteEditor from "~/components/NoteEditor";
import { PageHeader, EmptyState, ColoredDot } from "~/components/ui";

export default function NotesPage() {
  const { t } = useLocale();
  const { items: notes, loading } = useCollection<Note>("notes");
  const { items: customCategories } = useCollection<Category>("categories");
  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);
  const subjects = categoriesByScope(categories, "subject");

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string>("all");
  const [editor, setEditor] = useState<Note | null | "new">(null);

  const visible = useMemo(() => {
    let list = [...notes];
    if (subject !== "all") list = list.filter((n) => n.subjectId === subject);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, query, subject]);

  const inputCls =
    "rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div>
      <PageHeader
        title={t("notes")}
        subtitle={t("notesSubtitle")}
        action={
          <button
            onClick={() => setEditor("new")}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {t("notesNew")}
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("notesSearchPh")}
            className={`${inputCls} h-10 w-full pl-9`}
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`${inputCls} h-10`}
        >
          <option value="all">{t("notesAllSubjects")}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 && !loading ? (
        <EmptyState
          icon={<StickyNote className="h-8 w-8" />}
          title={query || subject !== "all" ? t("notesNotFound") : t("notesEmpty")}
          hint={query || subject !== "all" ? undefined : t("notesEmptyHint")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((n) => {
            const cat = n.subjectId ? findCategory(categories, n.subjectId) : null;
            return (
              <button
                key={n.id}
                onClick={() => setEditor(n)}
                className="group flex h-52 flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {n.pinned && (
                      <Pin className="mr-1 inline h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                    )}
                    {n.title}
                  </h3>
                </div>
                <p className="flex-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-500 line-clamp-5 dark:text-slate-400">
                  {n.body || "—"}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  {cat ? (
                    <span className="flex items-center gap-1.5">
                      <ColoredDot color={cat.color} />
                      {cat.name}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span>{formatNoteDate(n.updatedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {editor && (
        <NoteEditor
          key={typeof editor === "string" ? "new" : editor.id}
          onClose={() => setEditor(null)}
          existing={typeof editor === "string" ? null : editor}
        />
      )}
    </div>
  );
}

function formatNoteDate(iso: string): string {
  try {
    return formatLocal(new Date(iso), "d MMM");
  } catch {
    return "";
  }
}