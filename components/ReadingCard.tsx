"use client";

import { CalendarClock, CheckCircle2, TrendingDown } from "lucide-react";
import type { Reading } from "~/lib/types";
import { readingInfo, progressBarClass, type ReadingStatusKey } from "~/lib/reading";
import { formatDateShort } from "~/lib/dates";
import { useLocale } from "~/lib/i18n";
import { Chip, ProgressBar } from "./ui";

const STATUS_KEY: Record<ReadingStatusKey, "statusDone" | "statusBehind" | "statusOverTarget" | "statusOnTrack" | "statusReading"> = {
  done: "statusDone",
  behind: "statusBehind",
  overtarget: "statusOverTarget",
  ontrack: "statusOnTrack",
  reading: "statusReading",
};

export function ReadingCard({
  reading,
  onEdit,
  onDelete,
  onIncrement,
}: {
  reading: Reading;
  onEdit?: () => void;
  onDelete?: () => void;
  onIncrement?: () => void;
}) {
  const { t } = useLocale();
  const info = readingInfo(reading);
  const color = reading.color || "#3b82f6";

  const statusChip =
    info.done
      ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      : info.behind
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

  const chapterLabel = info.chapterTotal
    ? t("readChapterStr", { current: info.chapterCurrent, total: info.chapterTotal })
    : t("readChapterNoTotal", { n: info.chapterCurrent });

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
        info.behind && !info.done
          ? "border-red-200 dark:border-red-900"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {reading.subject}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Chip className={statusChip}>
            {info.done ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : info.behind ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <CalendarClock className="h-3 w-3" />
            )}
            {t(STATUS_KEY[info.statusKey])}
          </Chip>
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {t("edit")}
            </button>
          )}
        </div>
      </div>

      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{chapterLabel}</p>
        <div className="flex items-center gap-1.5">
          {onIncrement && (
            <button
              onClick={onIncrement}
              className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {t("readAddChapter")}
            </button>
          )}
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {info.percent}%
          </p>
        </div>
      </div>
      <ProgressBar value={info.percent} barClass={progressBarClass(info)} />

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        {reading.targetDate ? (
          <span>
            {t("readTargetDate", { date: formatDateShort(reading.targetDate) })}
            {info.daysLeft !== null && !info.done && (
              <span
                className={
                  info.daysLeft <= 7
                    ? "font-semibold text-orange-600 dark:text-orange-400"
                    : ""
                }
              >
                {" "}
                · {t("readDaysLeft", { n: Math.max(0, info.daysLeft) })}
              </span>
            )}
          </span>
        ) : (
          <span>{t("readNoTarget")}</span>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="font-medium text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
          >
            {t("delete")}
          </button>
        )}
      </div>
    </div>
  );
}