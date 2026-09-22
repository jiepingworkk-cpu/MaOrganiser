"use client";

import { useEffect } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { getFBMessaging, getFBDB, canUsePush } from "./firebase";
import type { TaskItem } from "./types";
import { getUrgency, daysUntil } from "./urgency";
import { useAuth } from "./auth";

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw");
  } catch {
    return null;
  }
}

export async function subscribeToPush(uid: string): Promise<boolean> {
  if (!canUsePush) return false;
  try {
    if (!notificationsSupported()) return false;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;
    const messaging = await getFBMessaging();
    if (!messaging) return false;
    const reg = await registerServiceWorker();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg ?? undefined,
    });
    if (!token) return false;
    await setDeviceToken(uid, token);
    return true;
  } catch (err) {
    console.warn("Push subscribe ล้มเหลว:", err);
    return false;
  }
}

export async function setDeviceToken(uid: string, token: string): Promise<void> {
  const { setDoc } = await import("firebase/firestore");
  await setDoc(doc(getFBDB(), "users", uid, "devices", token), {
    token,
    lastSeen: Date.now(),
  });
}

export async function removeDeviceToken(uid: string, token: string): Promise<void> {
  try {
    await deleteDoc(doc(getFBDB(), "users", uid, "devices", token));
  } catch {
    // ignore
  }
}

/** ลงทะเบียนรับ push ตอนแท็บเปิดอยู่ → แสดง Notification ยามมีข้อความ */
export function setupForegroundListener(): () => void {
  let cancelled = false;
  getFBMessaging().then((messaging) => {
    if (!messaging || cancelled) return;
    const unsub = onMessage(messaging, (payload) => {
      const data = payload.data ?? {};
      const title = data.title || "Organiser";
      const body = data.body || "มีการแจ้งเตือนใหม่";
      if (notificationsSupported() && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icon.svg",
          badge: "/icon.svg",
        });
      }
    });
    (globalThis as unknown as Record<string, unknown>).__foregroundUnsub__ = unsub;
  });
  return () => {
    cancelled = true;
    getFBMessaging().then(() => {
      const unsub = (
        globalThis as unknown as Record<string, unknown>
      ).__foregroundUnsub__ as (() => void) | undefined;
      unsub?.();
    });
  };
}

const WATCH_KEY = "organiser:notified:v1";

function loadNotified(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(WATCH_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set();
  }
}

function saveNotified(set: Set<string>): void {
  try {
    window.sessionStorage.setItem(WATCH_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

/**
 * ตรวจจับงานใกล้ deadline ทุก 60 วินาที ขณะแท็บเปิดอยู่
 * และแสดง Notification จริง (เบราว์เซอร์) แบบไม่ซ้ำ
 */
export function useDeadlineWatcher(tasks: TaskItem[]): void {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const notify = () => {
      if (
        !notificationsSupported() ||
        Notification.permission !== "granted"
      ) {
        return;
      }
      const notified = loadNotified();
      let changed = false;
      for (const task of tasks) {
        if (task.done || !task.dueDate) continue;
        const level = getUrgency(task.dueDate, false);
        if (level !== "overdue" && level !== "critical") continue;
        if (notified.has(task.id)) continue;
        const days = daysUntil(task.dueDate);
        const label =
          days < 0 ? `เลยกำหนด ${Math.abs(days)} วัน` : "ครบกำหนดวันนี้!";
        try {
          new Notification(`⏰ ${label}: ${task.title}`, {
            body: urgencyHint(task),
            icon: "/icon.svg",
            badge: "/icon.svg",
          });
        } catch {
          // Safari/บางเบราว์เซอร์ ไม่รองรับ properties → ส่งแบบธรรมดา
          try {
            new Notification(`${label} ${task.title}`);
          } catch {
            // ignore
          }
        }
        notified.add(task.id);
        changed = true;
      }
      if (changed) saveNotified(notified);
    };

    notify();
    const id = window.setInterval(notify, 60_000);
    return () => window.clearInterval(id);
  }, [tasks, user]);
}

function urgencyHint(task: TaskItem): string {
  const p: Record<string, string> = {
    high: "สำคัญสูง",
    medium: "สำคัญปานกลาง",
    low: "สำคัญน้อย",
  };
  const parts: string[] = [];
  if (task.priority) parts.push(p[task.priority]);
  if (task.categoryId) parts.push(task.categoryId);
  return parts.length ? parts.join(" · ") : "อย่าลืมทำ";
}