import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import type { AppEvent, TaskItem } from "./types";

export const serverConfig = {
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
};

export function hasServerConfig(): boolean {
  return Boolean(
    serverConfig.clientEmail && serverConfig.privateKey && serverConfig.projectId
  );
}

function app() {
  if (!hasServerConfig()) return null;
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: serverConfig.projectId,
        clientEmail: serverConfig.clientEmail,
        privateKey: serverConfig.privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getApps()[0];
}

export async function verifyIdToken(
  token: string
): Promise<DecodedIdToken | null> {
  const a = app();
  if (!a) return null;
  try {
    return await getAuth(a).verifyIdToken(token);
  } catch {
    return null;
  }
}

/** วันนี้ตามเวลาไทย (+07:00) */
export function todayTH(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(
    now.getUTCDate()
  )}`;
}

interface Reminder {
  title: string;
  body: string;
}

async function collectUserReminders(uid: string, test: boolean): Promise<Reminder[]> {
  const a = app();
  if (!a) return [];
  const db = getFirestore(a);
  const out: Reminder[] = [];
  const today = todayTH();

  try {
    const tasksSnap = await db
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .where("done", "==", false)
      .limit(200)
      .get();
    for (const d of tasksSnap.docs) {
      const t = d.data() as TaskItem;
      if (!t.dueDate) continue;
      if (t.dueDate === today) {
        out.push({
          title: `🟥 ครบกำหนดวันนี้`,
          body: t.title,
        });
      } else if (t.dueDate < today) {
        const days = Math.round(
          (new Date(today).getTime() - new Date(t.dueDate).getTime()) / 86400000
        );
        out.push({
          title: `⏰ เลยกำหนด ${days} วัน`,
          body: t.title,
        });
      }
    }
  } catch {
    // ignore sub-collection errors
  }

  try {
    const eventsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("events")
      .limit(200)
      .get();
    for (const d of eventsSnap.docs) {
      const e = d.data() as AppEvent;
      if (e.date === today) {
        out.push({
          title: `📅 วันนี้`,
          body: e.title,
        });
      }
    }
  } catch {
    // ignore
  }

  if (test) {
    out.push({
      title: "✅ ทดสอบการแจ้งเตือน",
      body: "คุณเห็นข้อความนี้ แปลว่า push notification ทำงานได้",
    });
  }

  // จำกัดจำนวน ข้อความละไม่เกิน 5
  return out.slice(0, 5);
}

export async function sendUserReminders(
  uid: string,
  test = false
): Promise<{ ok: boolean; sent: number; message?: string }> {
  const a = app();
  if (!a) {
    return {
      ok: false,
      sent: 0,
      message: "ยังไม่ได้ตั้งค่า FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY",
    };
  }
  const db = getFirestore(a);
  const reminders = await collectUserReminders(uid, test);
  if (reminders.length === 0) {
    return { ok: true, sent: 0 };
  }

  const devicesSnap = await db
    .collection("users")
    .doc(uid)
    .collection("devices")
    .get();
  const tokens = devicesSnap.docs.map((d) => d.data().token as string);
  if (tokens.length === 0) {
    return { ok: true, sent: 0, message: "ยังไม่มีอุปกรณ์ลงทะเบียน push" };
  }

  const calls = tokens.flatMap((token, i) =>
    reminders.map((r) => ({
      token,
      data: {
        title: r.title,
        body: r.body,
        url: "/",
        tag: `reminder-${i}`,
      },
    }))
  );

  const res = await getMessaging(a).sendEach(calls);

  return { ok: true, sent: res.successCount };
}

export async function sendAllReminders(): Promise<{ ok: boolean; sent: number }> {
  const a = app();
  if (!a) return { ok: false, sent: 0 };
  const db = getFirestore(a);
  const usersSnap = await db.collection("users").limit(500).get();
  let sent = 0;
  for (const u of usersSnap.docs) {
    const r = await sendUserReminders(u.id, false);
    sent += r.sent;
  }
  return { ok: true, sent };
}