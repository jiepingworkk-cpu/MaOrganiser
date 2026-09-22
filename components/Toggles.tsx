"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale } from "~/lib/i18n";
import { useTheme } from "~/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  return (
    <button
      onClick={toggle}
      aria-label={t("themeToggle")}
      title={t("themeToggle")}
      className={`rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "th" ? "en" : "th")}
      aria-label={t("langToggle")}
      title={t("langToggle")}
      className={`rounded-lg p-2 text-[11px] font-bold tracking-wide text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      {locale === "th" ? "EN" : "ไทย"}
    </button>
  );
}