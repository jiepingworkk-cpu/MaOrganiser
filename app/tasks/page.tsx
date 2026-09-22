"use client";

import { useMemo, useState } from "react";
import { Plus, Check, Pencil, Trash2, ListChecks } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection, addItem, updateItem, removeItem } from "~/lib/db";
import { useLocale, type TKey } from "~/lib/i18n";
import { mergeCategories, findCategory } from "~/lib/categories";
import type { TaskItem, Category, Priority } from "~/lib/types";
import { getUrgency, URGENCY, compareUrgency, daysUntil } from "~/lib/urgency";
import TaskModal from "~/components/TaskModal";
import { Chip, PageHeader, EmptyState } from "~/components/ui";

type Filter = "all" | "open" | "done" | "overdue";

const FILTERS: { key: Filter; label: TKey }[] = [
  { key: "all", label: "filterAll" },
  { key: "open", label: "filterOpen" },
  { key: "done", label: "filterDone" },
  { key: "overdue", label: "filterOverdue" },
];

const PRIORITY_LABEL: Record<Priority, TKey> = {
  high: "taskHigh",
  medium: "taskMedium",
  low: "taskLow",
};

export default function TasksPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { items: tasks, loading } = useCollection<TaskItem>("tasks");
  const { items: customCategories } = useCollection<Category>("categories");
  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);

  const [filter, setFilter] = useState<Filter>("open");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [modal, setModal] = useState<{
    existing: TaskItem | null;
    defaultDate?: string;
  } | null>(null);

  const counts = useMemo(() => {
    const open = tasks.filter((x) => !x.done);
    return {
      all: tasks.length,
      open: open.length,
      done: tasks.length - open.length,
      overdue: open.filter((x) => x.dueDate && getUrgency(x.dueDate) === "overdue").length,
    };
  }, [tasks]);

  const visible = useMemo(() => {
    let list = [...tasks];
    if (filter === "open") list = list.filter((x) => !x.done);
    if (filter === "done") list = list.filter((x) => x.done);
    if (filter === "overdue")
      list = list.filter((x) => !x.done && x.dueDate && getUrgency(x.dueDate) === "overdue");
    return list.sort(compareUrgency);
  }, [tasks, filter]);

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    await addItem<TaskItem>(user.uid, "tasks", {
      title: title.trim(),
      priority,
      dueDate: dueDate || null,
      done: false,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    setDueDate("");
  }

  async function toggle(x: TaskItem) {
    if (!user) return;
    await updateItem<TaskItem>(user.uid, "tasks", x.id, { done: !x.done });
  }

  async function del(x: TaskItem) {
    if (!user) return;
    if (!window.confirm(t("confirmDeleteTask", { name: x.title }))) return;
    await removeItem(user.uid, "tasks", x.id);
  }

  const inputCls =
    "rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div>
      <PageHeader
        title={t("tasks")}
        subtitle={t("tasksSubtitle", { open: counts.open, overdue: counts.overdue })}
        action={
          <button
            onClick={() => setModal({ existing: null })}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {t("quickAddTask")}
          </button>
        }
      />

      {/* Quick add */}
      <form
        onSubmit={quickAdd}
        className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("taskQuickPh")}
          className={`${inputCls} col-span-2 h-10 sm:col-span-1 sm:w-64`}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={`${inputCls} h-10`}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className={`${inputCls} h-10`}
        >
          <option value="high">{t("taskHigh")}</option>
          <option value="medium">{t("taskMedium")}</option>
          <option value="low">{t("taskLow")}</option>
        </select>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" />
          {t("add")}
        </button>
      </form>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1 no-scrollbar dark:bg-slate-800">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t(f.label)}
            {counts[f.key] > 0 && (
              <span className="ml-1 text-[10px] opacity-60">{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 && !loading ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title={
            filter === "all"
              ? t("taskEmptyAll")
              : filter === "overdue"
                ? t("taskEmptyOverdue")
                : t("taskEmptyInFilter")
          }
          hint={filter === "open" ? t("taskEmptyOpenHint") : undefined}
        />
      ) : (
        <div className="space-y-2">
          {visible.map((x) => {
            const level = getUrgency(x.dueDate, x.done);
            const u = URGENCY[level];
            const cat = x.categoryId ? findCategory(categories, x.categoryId) : null;
            return (
              <div
                key={x.id}
                className={`group flex items-start gap-3 rounded-xl border border-l-4 bg-white p-3 shadow-sm transition hover:shadow-md ${
                  x.done
                    ? "border-slate-100 opacity-60 dark:border-slate-800"
                    : "border-slate-200 dark:border-slate-700"
                } dark:bg-slate-900`}
                style={{ borderLeftColor: x.done ? "transparent" : u.dot }}
              >
                <button
                  onClick={() => toggle(x)}
                  aria-label={x.done ? t("taskMarkUndone") : t("taskMarkDone")}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    x.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 text-transparent hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-400"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      x.done
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {x.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {cat && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    )}
                    <Chip
                      className={
                        x.priority === "high"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                          : x.priority === "medium"
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {t(PRIORITY_LABEL[x.priority])}
                    </Chip>
                    {!x.done && x.dueDate && (
                      <Chip className={`${u.bg} ${u.text} border ${u.border}`}>
                        {level === "overdue"
                          ? t("taskOverdueDays", { n: Math.abs(daysUntil(x.dueDate)) })
                          : level === "critical"
                            ? t("taskDueToday")
                            : t("taskDaysLeft", { n: daysUntil(x.dueDate) })}
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => setModal({ existing: x })}
                    aria-label={t("edit")}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => del(x)}
                    aria-label={t("delete")}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">{t("taskLegend")}</p>

      {modal && (
        <TaskModal
          key={modal.existing?.id ?? "new"}
          onClose={() => setModal(null)}
          existing={modal.existing}
          defaultDate={modal.defaultDate}
        />
      )}
    </div>
  );
}