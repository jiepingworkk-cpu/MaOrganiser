"use client";

import { useMemo, useState } from "react";
import { Plus, BookOpen, TrendingDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection, updateItem, removeItem } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import type { Reading } from "~/lib/types";
import { readingInfo } from "~/lib/reading";
import { ReadingCard } from "~/components/ReadingCard";
import ReadingEditor from "~/components/ReadingEditor";
import { PageHeader, EmptyState, Chip } from "~/components/ui";

export default function ReadingPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { items: reading, loading } = useCollection<Reading>("reading");
  const [editor, setEditor] = useState<Reading | null | "new">(null);

  const summary = useMemo(() => {
    const behind = reading.filter((r) => {
      const i = readingInfo(r);
      return i.behind && !i.done;
    });
    const done = reading.filter((r) => readingInfo(r).done).length;
    return { behind, done };
  }, [reading]);

  async function increment(r: Reading) {
    if (!user) return;
    await updateItem<Reading>(user.uid, "reading", r.id, {
      currentChapter: r.currentChapter + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  async function removeReading(r: Reading) {
    if (!user) return;
    if (!window.confirm(t("confirmDeleteReading", { name: r.subject }))) return;
    await removeItem(user.uid, "reading", r.id);
  }

  return (
    <div>
      <PageHeader
        title={t("readingNav")}
        subtitle={
          summary.behind.length > 0
            ? t("readingSubtitleBehind", { n: summary.behind.length })
            : reading.length > 0
              ? t("readingSubtitleOk")
              : undefined
        }
        action={
          <button
            onClick={() => setEditor("new")}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {t("readingAdd")}
          </button>
        }
      />

      {/* สรุปภาพรวม */}
      {reading.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          {summary.behind.length > 0 ? (
            <>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                {t("readingBehind")}
              </span>
              {summary.behind.map((r) => (
                <Chip key={r.id} className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {r.subject} ({readingInfo(r).percent}%)
                </Chip>
              ))}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {t("readingAllGood")}
            </span>
          )}
          {summary.done > 0 && (
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              {t("readingDoneCount", { n: summary.done })}
            </span>
          )}
        </div>
      )}

      {reading.length === 0 && !loading ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={t("readingEmpty")}
          hint={t("readingEmptyHint")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reading.map((r) => (
            <ReadingCard
              key={r.id}
              reading={r}
              onEdit={() => setEditor(r)}
              onDelete={() => removeReading(r)}
              onIncrement={() => increment(r)}
            />
          ))}
        </div>
      )}

      {editor && (
        <ReadingEditor
          key={typeof editor === "string" ? "new" : editor.id}
          onClose={() => setEditor(null)}
          existing={typeof editor === "string" ? null : editor}
        />
      )}
    </div>
  );
}