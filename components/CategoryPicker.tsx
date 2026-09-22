"use client";

import { useState } from "react";
import { Check, Plus, Trash, X } from "lucide-react";
import { addItem, removeItem } from "~/lib/db";
import { useAuth } from "~/lib/auth";
import { useLocale } from "~/lib/i18n";
import { PALETTE, categoriesByScope } from "~/lib/categories";
import type { Category, CategoryScope } from "~/lib/types";

export default function CategoryPicker({
  categories,
  scope,
  value,
  onChange,
  placeholder,
  allowCustom = true,
}: {
  categories: Category[];
  scope: CategoryScope;
  value?: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allowCustom?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const opts = categoriesByScope(categories, scope);
  const customOpts = opts.filter((c) => !c.preset);

  async function addCustom() {
    if (!user || !name.trim()) return;
    const id = await addItem<Category>(user.uid, "categories", {
      name: name.trim(),
      color,
      scope,
    });
    onChange(id);
    setName("");
    setAdding(false);
    setColor(PALETTE[0]);
  }

  async function deleteCustom(c: Category) {
    if (!user) return;
    if (!window.confirm(t("catConfirmDelete", { name: c.name }))) return;
    await removeItem(user.uid, "categories", c.id);
    if (value === c.id) onChange(null);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500"
      >
        <option value="">— {placeholder ?? t("catPhDefault")} —</option>
        {opts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {allowCustom &&
        (adding ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 sm:items-center sm:p-4"
            onClick={() => setAdding(false)}
          >
            <div
              className="w-full rounded-t-2xl bg-white p-4 shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 sm:max-w-sm sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {scope === "subject" ? t("catAddSubject") : t("catAddEvent")}
                </p>
                <button
                  onClick={() => setAdding(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="ปิด"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder={t("catPhName")}
                className="mb-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <div className="mb-4 flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                      color === c ? "ring-2 ring-slate-800 ring-offset-2 dark:ring-white dark:ring-offset-slate-900" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`สี ${c}`}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
              <button
                onClick={addCustom}
                disabled={!name.trim()}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-slate-900"
              >
                {t("catAddBtn")}
              </button>

              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t("catYours")}
                </p>
                {customOpts.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-center text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    {t("catNone")}
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {customOpts.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                          {c.name}
                        </span>
                        <button
                          onClick={() => deleteCustom(c)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label={`${t("catDeleteBtn")}: ${c.name}`}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t("catAddEvent")}
          >
            <Plus className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}