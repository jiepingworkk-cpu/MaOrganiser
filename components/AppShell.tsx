"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  StickyNote,
  BookOpen,
  LogOut,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection } from "~/lib/db";
import { useLocale, type TKey } from "~/lib/i18n";
import {
  useDeadlineWatcher,
  setupForegroundListener,
  registerServiceWorker,
} from "~/lib/notifications";
import NotifyButton from "./NotifyButton";
import { LangToggle, ThemeToggle } from "./Toggles";
import type { TaskItem } from "~/lib/types";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  const { items: tasks } = useCollection<TaskItem>("tasks");
  useDeadlineWatcher(tasks);

  useEffect(() => {
    if (!user) return;
    registerServiceWorker();
    const unsub = setupForegroundListener();
    return unsub;
  }, [user]);

  const NAV: {
    href: string;
    label: TKey;
    short: TKey;
    icon: LucideIcon;
  }[] = [
    { href: "/", label: "home", short: "homeShort", icon: LayoutDashboard },
    { href: "/calendar", label: "calendar", short: "calendarShort", icon: CalendarDays },
    { href: "/tasks", label: "tasks", short: "tasksShort", icon: ListChecks },
    { href: "/notes", label: "notes", short: "notesShort", icon: StickyNote },
    { href: "/reading", label: "readingNav", short: "readingShort", icon: BookOpen },
  ];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "ผู้ใช้";
  const initial = user?.displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-dvh md:pl-64">
      {/* Sidebar — จอคอม/แท็บเล็ตแนวนอน */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="px-5 pb-2 pt-5">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />
                {t(n.label)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 px-5 pb-3">
          <LangToggle />
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <RefreshCw className="h-3 w-3" />
            {t("syncNote")}
          </p>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-400 dark:text-slate-500">
              {user?.email}
            </p>
          </div>
          <NotifyButton />
          <button
            onClick={signOut}
            aria-label={t("logout")}
            title={t("logout")}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* Header — มือถือ */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <Logo />
        <div className="flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <NotifyButton />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:px-8 md:pb-14 md:pt-7">
        {children}
      </main>

      {/* Bottom nav — มือถือ */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pt-1 pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium ${
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                <n.icon className={`h-5 w-5 ${active ? "stroke-2" : ""}`} />
                {t(n.short)}
                <span
                  className={`h-1 w-1 rounded-full ${
                    active ? "bg-orange-500" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800">
        <RefreshCw className="h-4 w-4 text-orange-400" />
      </div>
      <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Organiser
      </span>
    </div>
  );
}