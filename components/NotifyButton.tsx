"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Send,
  Trash2,
  CircleAlert,
} from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useCollection } from "~/lib/db";
import { useLocale } from "~/lib/i18n";
import {
  subscribeToPush,
  notificationsSupported,
  removeDeviceToken,
} from "~/lib/notifications";
import { sendTestPush } from "~/lib/api";
import type { Device } from "~/lib/types";
import { Spinner } from "./ui";

export default function NotifyButton() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"enable" | "disable" | "test" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const { items: devices } = useCollection<Device>("devices");

  const supported = notificationsSupported();
  const granted =
    supported && typeof Notification !== "undefined" && Notification.permission === "granted";

  async function enable() {
    if (!user) return;
    setBusy("enable");
    setMsg(null);
    const ok = await subscribeToPush(user.uid);
    setMsg(ok ? t("notifyMsgOn") : t("notifyMsgFail"));
    setBusy(null);
  }

  async function disable() {
    if (!user) return;
    setBusy("disable");
    for (const d of devices) await removeDeviceToken(user.uid, d.token);
    setMsg(t("notifyMsgOff"));
    setBusy(null);
  }

  async function test() {
    if (!user) return;
    setBusy("test");
    setMsg(null);
    const token = await user.getIdToken();
    const res = await sendTestPush(token);
    setMsg(res.ok ? t("notifyMsgSent", { n: res.sent ?? 0 }) : (res.message ?? "Error"));
    setBusy(null);
  }

  const Icon = granted ? BellRing : supported ? Bell : BellOff;
  const title = granted
    ? t("notifyOn")
    : supported
      ? t("notifyOff")
      : t("notifyUnsupported");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={title}
        title={title}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <Icon className="h-5 w-5" />
        {supported && !granted && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-400" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-[19rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:fixed sm:right-4 sm:top-14 sm:mt-0">
            <div className="mb-3 flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {title}
              </p>
            </div>

            <div className="space-y-2">
              {!granted ? (
                <button
                  onClick={enable}
                  disabled={busy !== null || !supported}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                >
                  {busy === "enable" ? <Spinner className="h-4 w-4 border-white/40 border-t-white dark:border-slate-300/40 dark:border-t-slate-900" /> : <Bell className="h-4 w-4" />}
                  {t("notifyEnable")}
                </button>
              ) : (
                <>
                  <button
                    onClick={test}
                    disabled={busy !== null || devices.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  >
                    {busy === "test" ? (
                      <Spinner className="h-4 w-4 border-white/40 border-t-white dark:border-slate-300/40 dark:border-t-slate-900" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("notifyTest", { n: devices.length })}
                  </button>
                  <button
                    onClick={disable}
                    disabled={busy !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {busy === "disable" ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t("notifyDisable")}
                  </button>
                </>
              )}
            </div>

            {msg && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                {msg}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}