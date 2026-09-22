"use client";

import { useMemo, useState } from "react";
import { useAuth } from "~/lib/auth";
import { useCollection, addItem, updateItem, removeItem } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import { Modal } from "./ui";
import CategoryPicker from "./CategoryPicker";
import type { TaskItem, Category, Priority } from "~/lib/types";
import { mergeCategories } from "~/lib/categories";
import { FooterButtons, Label } from "./EventModal";

export default function TaskModal({
  onClose,
  existing,
  defaultDate,
}: {
  onClose: () => void;
  existing?: TaskItem | null;
  defaultDate?: string;
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const { items: customCategories } = useCollection<Category>("categories");
  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.categoryId ?? null
  );
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? defaultDate ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "medium");
  const [done, setDone] = useState(existing?.done ?? false);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || !title.trim()) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      categoryId: categoryId ?? undefined,
      dueDate: dueDate || null,
      priority,
      done,
      note: note.trim() || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      if (existing) {
        await updateItem<TaskItem>(user.uid, "tasks", existing.id, data);
      } else {
        await addItem<TaskItem>(user.uid, "tasks", data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!user || !existing) return;
    if (!window.confirm(t("confirmDeleteTask", { name: existing.title }))) return;
    await removeItem(user.uid, "tasks", existing.id);
    onClose();
  }

  return (
    <Modal onClose={onClose} title={existing ? t("taskEditTitle") : t("taskNewTitle")}>
      <div className="space-y-4">
        <div>
          <Label>ชื่องาน</Label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={t("taskTitlePh")}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <Label>{t("labelCategory")}</Label>
          <CategoryPicker
            categories={categories}
            scope="event"
            value={categoryId}
            onChange={setCategoryId}
            placeholder={t("catPick")}
          />
        </div>

        <div>
          <Label>{t("labelDue")}</Label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <Label>{t("labelPriority")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  v: "high",
                  label: t("taskHigh"),
                  cls: "text-red-600 border-red-200 bg-red-50 dark:text-red-300 dark:border-red-900 dark:bg-red-950/40",
                },
                {
                  v: "medium",
                  label: t("taskMedium"),
                  cls: "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-300 dark:border-orange-900 dark:bg-orange-950/40",
                },
                {
                  v: "low",
                  label: t("taskLow"),
                  cls: "text-slate-600 border-slate-200 bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800",
                },
              ] as const
            ).map((p) => (
              <button
                key={p.v}
                onClick={() => setPriority(p.v as Priority)}
                className={`rounded-lg border py-2 text-xs font-semibold transition ${
                  priority === p.v
                    ? p.cls
                    : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t("labelNote")}</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={t("taskNotePh")}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {existing && (
          <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              className="h-4 w-4 accent-slate-900"
            />
            {t("taskDoneCheck")}
          </label>
        )}

        <FooterButtons
          onCancel={onClose}
          onSave={save}
          saving={saving}
          isEdit={!!existing}
          saveDisabled={!title.trim()}
          saveLabel={t("save")}
          addLabel={t("add")}
          onDelete={existing ? del : undefined}
          deleteLabel={t("delete")}
        />
      </div>
    </Modal>
  );
}