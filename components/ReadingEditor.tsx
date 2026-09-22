"use client";

import { useState } from "react";
import { useAuth } from "~/lib/auth";
import { addItem, updateItem, removeItem } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import { Modal } from "./ui";
import type { Reading } from "~/lib/types";
import { hashCode, PALETTE } from "~/lib/categories";
import { toDateInput, today } from "~/lib/dates";
import { FooterButtons, Label } from "./EventModal";

export default function ReadingEditor({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: Reading | null;
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [totalChapters, setTotalChapters] = useState(
    existing?.totalChapters ? String(existing.totalChapters) : ""
  );
  const [currentChapter, setCurrentChapter] = useState(
    String(existing?.currentChapter ?? 0)
  );
  const [percent, setPercent] = useState(
    existing?.percent != null ? String(existing.percent) : ""
  );
  const [startDate, setStartDate] = useState(
    existing?.startDate ?? toDateInput(today())
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || !subject.trim()) return;
    setSaving(true);
    const color =
      existing?.color ?? PALETTE[hashCode(subject.trim()) % PALETTE.length];
    const data = {
      subject: subject.trim(),
      color,
      totalChapters: totalChapters ? Math.max(1, Number(totalChapters)) : null,
      currentChapter: Math.max(0, Number(currentChapter) || 0),
      percent: percent ? Math.min(100, Math.max(0, Number(percent))) : null,
      startDate,
      targetDate: targetDate || null,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    try {
      if (existing) {
        await updateItem<Reading>(user.uid, "reading", existing.id, data);
      } else {
        await addItem<Reading>(user.uid, "reading", data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!user || !existing) return;
    if (!window.confirm(t("confirmDeleteReading", { name: existing.subject }))) return;
    await removeItem(user.uid, "reading", existing.id);
    onClose();
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <Modal
      onClose={onClose}
      title={existing ? t("readEditTitle") : t("readNewTitle")}
    >
      <div className="space-y-4">
        <div>
          <Label>{t("readSubject")}</Label>
          <input
            autoFocus
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("readSubjectPh")}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("readTotalCh")}</Label>
            <input
              type="number"
              min={1}
              value={totalChapters}
              onChange={(e) => setTotalChapters(e.target.value)}
              placeholder="12"
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t("readCurrentCh")}</Label>
            <input
              type="number"
              min={0}
              value={currentChapter}
              onChange={(e) => setCurrentChapter(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <Label>{t("readPercent")}</Label>
          <input
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder={t("readPercentPh")}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("readStart")}</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t("readTarget")}</Label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          {t("readHint")}
        </p>

        <FooterButtons
          onCancel={onClose}
          onSave={save}
          saving={saving}
          isEdit={!!existing}
          saveDisabled={!subject.trim()}
          saveLabel={t("save")}
          addLabel={t("add")}
          onDelete={existing ? del : undefined}
          deleteLabel={t("delete")}
        />
      </div>
    </Modal>
  );
}