"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCollection } from "~/lib/db";
import { useLocale, weekdayShort } from "~/lib/i18n";
import { mergeCategories, categoriesByScope, findCategory } from "~/lib/categories";
import type { AppEvent, Category } from "~/lib/types";
import {
  monthGrid,
  monthLabel,
  toDateInput,
  parseDateLocal,
  isSameDay,
  isSameMonth,
  addMonths,
  today,
} from "~/lib/dates";
import EventModal from "~/components/EventModal";
import { Modal, PageHeader, EmptyState } from "~/components/ui";

export default function CalendarPage() {
  const { t, locale } = useLocale();
  const { items: events, loading } = useCollection<AppEvent>("events");
  const { items: customCategories } = useCollection<Category>("categories");
  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);
  const eventCategories = categoriesByScope(categories, "event");

  const [month, setMonth] = useState(() => new Date());
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [modal, setModal] = useState<{ existing: AppEvent | null; date: string | null } | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, AppEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const cells = monthGrid(month);
  const todayStr = toDateInput(today());

  const sheetEvents = sheetDate ? (byDate.get(sheetDate) ?? []) : [];
  const sheetLabel = sheetDate ? monthLabel(parseDateLocal(sheetDate)) : "";

  return (
    <div>
      <PageHeader
        title={t("calendar")}
        subtitle={t("calSubtitle")}
        action={
          <button
            onClick={() => setModal({ existing: null, date: todayStr })}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {t("calAddEvent")}
          </button>
        }
      />

      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">
          {monthLabel(month)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("calPrev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("today")}
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("calNext")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/** Legend */}
      {eventCategories.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          {eventCategories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
          {weekdayShort(locale).map((d, i) => (
            <div
              key={d + i}
              className="py-2 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const ds = toDateInput(day);
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today());
            const dayEvents = byDate.get(ds) ?? [];
            return (
              <button
                key={ds}
                onClick={() => setSheetDate(ds)}
                className={`group flex h-[4.4rem] flex-col gap-0.5 border-b border-r border-slate-100 p-1 text-left align-top transition hover:bg-slate-50 sm:h-24 sm:p-1.5 ${
                  isToday ? "bg-orange-50/70 dark:bg-orange-950/30" : ""
                } ${
                  !inMonth ? "bg-slate-50/60 dark:bg-slate-800/40" : "bg-white dark:bg-slate-900"
                } dark:border-slate-800 dark:hover:bg-slate-800/60`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isToday
                      ? "bg-orange-500 text-white"
                      : inMonth
                        ? "text-slate-600 dark:text-slate-300"
                        : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="no-scrollbar flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 2).map((e) => {
                    const cat = findCategory(categories, e.categoryId);
                    return (
                      <span
                        key={e.id}
                        className="hidden items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white sm:flex"
                        style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                      >
                        <span className="truncate">{e.title}</span>
                      </span>
                    );
                  })}
                  {dayEvents.length === 0 && inMonth && (
                    <span className="hidden flex-1 items-center justify-center text-[10px] text-slate-200 group-hover:text-slate-300 sm:flex dark:text-slate-700 dark:group-hover:text-slate-500">
                      +
                    </span>
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex items-center gap-0.5 sm:hidden">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: findCategory(categories, dayEvents[0].categoryId)?.color ?? "#94a3b8",
                      }}
                    />
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* เปิดรายการวันนั้น */}
      <Modal
        open={!!sheetDate}
        onClose={() => setSheetDate(null)}
        title={
          sheetDate
            ? t("calDayTitle", { date: sheetDate.split("-").reverse().join("/") })
            : ""
        }
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setSheetDate(null);
              setModal({ existing: null, date: sheetDate });
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t("calAddToday")}
          </button>
          {sheetEvents.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              {t("calNoEventsDay")}
            </div>
          ) : (
            <div className="space-y-1.5">
              {sheetEvents.map((e) => {
                const cat = findCategory(categories, e.categoryId);
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      setSheetDate(null);
                      setModal({ existing: e, date: e.date });
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <span
                      className="h-3 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {e.title}
                      </p>
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                        {cat?.name ?? t("activityFallback")}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {sheetLabel && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">{sheetLabel}</p>
          )}
        </div>
      </Modal>

      {modal && (
        <EventModal
          key={modal.existing?.id ?? `new-${modal.date ?? "x"}`}
          onClose={() => setModal(null)}
          existing={modal.existing}
          defaultDate={modal.date ?? undefined}
        />
      )}

      {!loading && events.length === 0 && (
        <div className="mt-4">
          <EmptyState title={t("calEmptyTitle")} hint={t("calEmptyHint")} />
        </div>
      )}
    </div>
  );
}