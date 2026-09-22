"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ListChecks,
  BookOpen,
  BellRing,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection } from "~/lib/db";
import { mergeCategories, findCategory } from "~/lib/categories";
import { useLocale, type TKey } from "~/lib/i18n";
import type { TaskItem, AppEvent, Reading, Category } from "~/lib/types";
import { toDateInput, formatDateLong, today, parseDateLocal } from "~/lib/dates";
import { differenceInCalendarDays } from "date-fns";
import { URGENCY, getUrgency, daysUntil, type UrgencyLevel } from "~/lib/urgency";
import { subscribeToPush, notificationsSupported } from "~/lib/notifications";
import { ReadingCard } from "~/components/ReadingCard";
import { EmptyState, Chip } from "~/components/ui";

interface CountItem {
  key: string;
  title: string;
  date: string;
  categoryId: string;
  days: number;
  to: string;
  kind: string;
}

const URGENCY_KEY: Record<UrgencyLevel, TKey> = {
  overdue: "uOverdue",
  critical: "uCritical",
  urgent: "uUrgent",
  soon: "uSoon",
  normal: "uNormal",
  none: "uNone",
  done: "uDone",
};

const LEVEL_COLOR: Record<"critical" | "urgent" | "soon" | "normal", string> = {
  critical: "text-red-600 dark:text-red-400",
  urgent: "text-orange-600 dark:text-orange-400",
  soon: "text-amber-600 dark:text-amber-400",
  normal: "text-emerald-600 dark:text-emerald-400",
};

const LEVEL_LABEL: Record<"critical" | "urgent" | "soon" | "normal", TKey> = {
  critical: "uCritical",
  urgent: "uUrgent",
  soon: "uSoon",
  normal: "uNormal",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { items: events } = useCollection<AppEvent>("events");
  const { items: tasks } = useCollection<TaskItem>("tasks");
  const { items: reading } = useCollection<Reading>("reading");
  const { items: customCategories } = useCollection<Category>("categories");

  const [bannerOff, setBannerOff] = useState(false);
  const [opening, setOpening] = useState(false);

  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);
  const todayStr = useMemo(() => toDateInput(today()), []);
  const now = today();

  const countdown = useMemo(() => {
    const items: CountItem[] = [];
    for (const e of events) {
      const days = differenceInCalendarDays(parseDateLocal(e.date), now);
      if (days < 0 || days > 365) continue;
      items.push({
        key: `e-${e.id}`,
        title: e.title,
        date: e.date,
        categoryId: e.categoryId,
        days,
        to: "/calendar",
        kind: "event",
      });
    }
    for (const t of tasks) {
      if (t.done || !t.dueDate) continue;
      const days = differenceInCalendarDays(parseDateLocal(t.dueDate), now);
      if (days < 0 || days > 365) continue;
      items.push({
        key: `t-${t.id}`,
        title: t.title,
        date: t.dueDate,
        categoryId: t.categoryId ?? "",
        days,
        to: "/tasks",
        kind: "task",
      });
    }
    return items.sort((a, b) => a.days - b.days).slice(0, 6);
  }, [events, tasks, now]);

  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => a.title.localeCompare(b.title));

  const urgentTasks = useMemo(() => {
    const urgent = tasks.filter((x) => {
      if (x.done || !x.dueDate) return false;
      return getUrgency(x.dueDate, false) === "overdue" || daysUntil(x.dueDate) <= 3;
    });
    return urgent
      .sort(
        (a, b) =>
          URGENCY[getUrgency(a.dueDate)].weight - URGENCY[getUrgency(b.dueDate)].weight
      )
      .slice(0, 5);
  }, [tasks]);

  const readingTop = reading.slice(0, 4);

  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "greetMorning" : hour < 18 ? "greetAfternoon" : "greetEvening";
  const name = user?.displayName || user?.email?.split("@")[0] || "";
  const greeting = t(greetKey);
  const greetingLine =
    locale === "th"
      ? name
        ? `${greeting} คุณ${name} 🎯`
        : `${greeting} 🎯`
      : `${greeting}${name ? `, ${name}` : ""} 🎯`;

  const canNotify = notificationsSupported();
  const notifyOff =
    canNotify && typeof Notification !== "undefined" && Notification.permission !== "granted";

  async function enableNotify() {
    if (!user) return;
    setOpening(true);
    const ok = await subscribeToPush(user.uid);
    if (!ok) setBannerOff(true);
    setOpening(false);
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateLong(todayStr)}</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {greetingLine}
        </h1>
      </section>

      {/* Push banner */}
      {notifyOff && !bannerOff && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
            <BellRing className="h-4 w-4" />
            {t("pushBanner")}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={enableNotify}
              disabled={opening}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {opening ? t("pushOpening") : t("pushEnable")}
            </button>
            <button
              onClick={() => setBannerOff(true)}
              className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              {t("pushLater")}
            </button>
          </div>
        </div>
      )}

      {/* Countdown */}
      <section>
        <SectionTitle icon={<Flame className="h-4 w-4" />} title={t("dashCountdown")} />
        {countdown.length === 0 ? (
          <EmptyState title={t("dashCountEmpty")} hint={t("dashCountHint")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {countdown.map((c) => (
              <CountdownCard key={c.key} item={c} categories={categories} />
            ))}
          </div>
        )}
      </section>

      {/* Today + urgent */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title={t("dashToday")} href="/calendar" />
          {todayEvents.length === 0 && urgentTasks.length === 0 ? (
            <EmptyState title={t("dashTodayEmpty")} hint={t("dashTodayEmptyHint")} />
          ) : (
            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {todayEvents.map((e) => {
                const cat = findCategory(categories, e.categoryId);
                return (
                  <Link
                    key={e.id}
                    href="/calendar"
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                      {e.title}
                    </span>
                    <Chip className="text-slate-600 dark:text-slate-300">
                      {cat?.name ?? t("activityFallback")}
                    </Chip>
                  </Link>
                );
              })}
              {urgentTasks.slice(0, 3).map((x) => {
                const u = URGENCY[getUrgency(x.dueDate)];
                return (
                  <Link
                    key={x.id}
                    href="/tasks"
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className={`h-8 w-1 shrink-0 rounded-full ${u.bar}`} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
                      {x.title}
                    </span>
                    <Chip className={`${u.bg} ${u.text} border ${u.border}`}>
                      {t(URGENCY_KEY[getUrgency(x.dueDate)])}
                    </Chip>
                  </Link>
                );
              })}
              {urgentTasks.length > 3 && (
                <Link
                  href="/tasks"
                  className="flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  {t("dashUrgentAll")} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </section>

        <section>
          <SectionTitle icon={<BookOpen className="h-4 w-4" />} title={t("dashReadingTitle")} href="/reading" />
          {readingTop.length === 0 ? (
            <EmptyState title={t("dashReadingEmpty")} hint={t("dashReadingEmptyHint")} />
          ) : (
            <div className="grid gap-3">
              {readingTop.map((r) => (
                <ReadingCard key={r.id} reading={r} />
              ))}
              {reading.length > 4 && (
                <Link
                  href="/reading"
                  className="flex items-center justify-center gap-1 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {t("viewAll")} ({reading.length}) <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { href: "/calendar", label: t("quickAddEvent"), icon: <CalendarDays className="h-4 w-4" /> },
          { href: "/tasks", label: t("quickAddTask"), icon: <ListChecks className="h-4 w-4" /> },
          { href: "/reading", label: t("quickUpdateReading"), icon: <BookOpen className="h-4 w-4" /> },
        ].map((a) => (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            {a.icon}
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {t("viewAll")} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function CountdownCard({
  item,
  categories,
}: {
  item: CountItem;
  categories: Category[];
}) {
  const { t } = useLocale();
  const cat = findCategory(categories, item.categoryId);
  const days = item.days;
  const level: "critical" | "urgent" | "soon" | "normal" =
    days <= 0 ? "critical" : days <= 3 ? "urgent" : days <= 7 ? "soon" : "normal";

  return (
    <Link
      href={item.to}
      className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <p className={`text-2xl font-extrabold tracking-tight ${LEVEL_COLOR[level]}`}>
        {Math.max(0, days)}
        <span className="ml-1 text-xs font-semibold text-slate-400">{t("daysUnit")}</span>
      </p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800 group-hover:underline dark:text-slate-200">
        {item.title}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
        />
        <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
          {cat?.name ?? (item.kind === "task" ? t("taskKind") : t("activityFallback"))}
        </span>
        <span className={`ml-auto text-[10px] font-semibold ${LEVEL_COLOR[level]}`}>
          {t(LEVEL_LABEL[level])}
        </span>
      </div>
    </Link>
  );
}