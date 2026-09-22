import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
);

let app: FirebaseApp | null = null;

export function getApp(): FirebaseApp {
  if (!hasFirebaseConfig) {
    throw new Error("ยังไม่ได้ตั้งค่า Firebase (ดูในไฟล์ README)");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

let auth: Auth | null = null;

export function getFBAuth(): Auth {
  return (auth ??= getAuth(getApp()));
}

export async function ensureAuthPersistence(): Promise<void> {
  try {
    await setPersistence(getFBAuth(), browserLocalPersistence);
  } catch {
    // ignore — offline browser may reject; default persistence still applies
  }
}

let db: Firestore | null = null;

export function getFBDB(): Firestore {
  return (db ??= getFirestore(getApp()));
}

export async function enableOffline(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await enableIndexedDbPersistence(getFBDB());
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "already-exists" && code !== "failed-precondition") {
      console.warn("Offline persistence ไม่ทำงาน:", err);
    }
  }
}

let messaging: Messaging | null = null;

export async function getFBMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  return (messaging ??= getMessaging(getApp()));
}

/** Signal that the client env has everything needed for push. */
export const canUsePush =
  hasFirebaseConfig && Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);