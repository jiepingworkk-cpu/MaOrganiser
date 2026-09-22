"use client";

import { useMemo, useState } from "react";
import { Pin } from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection, addItem, updateItem, removeItem } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import { Modal } from "./ui";
import CategoryPicker from "./CategoryPicker";
import type { Note, Category } from "~/lib/types";
import { mergeCategories } from "~/lib/categories";
import { FooterButtons } from "./EventModal";

export default function NoteEditor({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: Note | null;
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const { items: customCategories } = useCollection<Category>("categories");
  const categories = useMemo(() => mergeCategories(customCategories), [customCategories]);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [subjectId, setSubjectId] = useState<string | null>(
    existing?.subjectId ?? null
  );
  const [body, setBody] = useState(existing?.body ?? "");
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || !title.trim()) return;
    setSaving(true);
    const now = new Date().toISOString();
    const data = {
      title: title.trim(),
      subjectId: subjectId ?? undefined,
      body,
      pinned,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    };
    try {
      if (existing) {
        await updateItem<Note>(user.uid, "notes", existing.id, data);
      } else {
        await addItem<Note>(user.uid, "notes", data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!user || !existing) return;
    if (!window.confirm(t("confirmDeleteNote", { name: existing.title }))) return;
    await removeItem(user.uid, "notes", existing.id);
    onClose();
  }

  return (
    <Modal onClose={onClose} title={existing ? t("noteEditTitle") : t("noteNewTitle")} wide>
      <div className="space-y-4">
        <div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("noteTitlePh")}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <CategoryPicker
          categories={categories}
          scope="subject"
          value={subjectId}
          onChange={setSubjectId}
          placeholder={t("notesChooseSubject")}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder={t("noteBodyPh")}
          className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPinned((p) => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              pinned
                ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${pinned ? "fill-orange-500 text-orange-500" : ""}`} />
            {t("notePin")}
          </button>
        </div>

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