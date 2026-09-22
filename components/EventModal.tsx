"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection, addItem, updateItem, removeItem } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import { Modal } from "./ui";
import CategoryPicker from "./CategoryPicker";
import type { AppEvent, Category } from "~/lib/types";
import { mergeCategories } from "~/lib/categories";
import { toDateInput, today } from "~/lib/dates";

export default function EventModal({
  onClose,
  existing,
  defaultDate,
}: {
  onClose: () => void;
  existing?: AppEvent | null;
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
  const [date, setDate] = useState(
    existing?.date ?? defaultDate ?? toDateInput(today())
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || !title.trim()) return;
    setSaving(true);
    const data = {
      title: title.trim(),
      categoryId: categoryId ?? "",
      date,
      allDay: true,
      note: note.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      if (existing) {
        await updateItem<AppEvent>(user.uid, "events", existing.id, data);
      } else {
        await addItem<AppEvent>(user.uid, "events", data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!user || !existing) return;
    if (!window.confirm(t("confirmDeleteEvent", { name: existing.title }))) return;
    await removeItem(user.uid, "events", existing.id);
    onClose();
  }

  return (
    <Modal
      onClose={onClose}
      title={existing ? t("calEventEditTitle") : t("calEventNewTitle")}
    >
      <div className="space-y-4">
        <div>
          <Label>{t("calEventTitle")}</Label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={t("calEventPh")}
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
          <Label>{t("calEventDate")}</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <Label>{t("labelNote")}</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={t("calEventNotePh")}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <FooterButtons
          onCancel={onClose}
          onSave={save}
          saving={saving}
          isEdit={!!existing}
          saveDisabled={!title.trim() || !date}
          saveLabel={t("save")}
          addLabel={t("add")}
          onDelete={existing ? del : undefined}
          deleteLabel={t("delete")}
        />
      </div>
    </Modal>
  );
}

export function FooterButtons({
  onCancel,
  onSave,
  saving,
  isEdit,
  saveDisabled,
  saveLabel,
  addLabel,
  onDelete,
  deleteLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  saveDisabled?: boolean;
  saveLabel: string;
  addLabel: string;
  onDelete?: () => void;
  deleteLabel: string;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2 pt-1">
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-4 w-4" />
          {deleteLabel}
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={onCancel}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {t("cancel")}
      </button>
      <button
        onClick={onSave}
        disabled={saveDisabled || saving}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {saving ? t("saving") : isEdit ? saveLabel : addLabel}
      </button>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
      {children}
    </label>
  );
}