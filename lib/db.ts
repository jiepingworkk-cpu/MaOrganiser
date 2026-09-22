"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getFBDB } from "./firebase";
import { useAuth } from "./auth";

export type WithId<T> = T & { id: string };

export interface CollectionState<T> {
  items: WithId<T>[];
  loading: boolean;
  error: boolean;
  uid?: string;
}

function userColl(uid: string, name: string) {
  return collection(getFBDB(), "users", uid, name);
}

/** ลบ field ที่เป็น undefined (Firestore ไม่ accept) */
function sanitize<T extends object>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export function useCollection<T>(name: string): CollectionState<T> {
  const { user } = useAuth();
  const [state, setState] = useState<CollectionState<T>>({
    items: [],
    loading: !!user,
    error: false,
    uid: user?.uid ?? "",
  });

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const unsub = onSnapshot(
      userColl(uid, name),
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as T) }) as WithId<T>
        );
        setState({ items, loading: false, error: false, uid });
      },
      () => setState((p) => ({ ...p, loading: false, error: true, uid }))
    );
    return unsub;
  }, [user, name]);

  if (!user) return { items: [], loading: false, error: false, uid: "" };
  if (state.uid !== user.uid) return { ...state, items: [], loading: true };
  return state;
}

export async function addItem<T extends object>(
  uid: string,
  name: string,
  data: Omit<T, "id">
): Promise<string> {
  const ref = await addDoc(userColl(uid, name), sanitize(data as T));
  return ref.id;
}

export async function updateItem<T extends object>(
  uid: string,
  name: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(userColl(uid, name), id), sanitize(data as T));
}

export async function removeItem(
  uid: string,
  name: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(userColl(uid, name), id));
}

/** ตัวช่วยสร้าง updatedAt/createdAt (ISO, ใช้เวลาเครื่อง) */
export function nowIso(): string {
  return new Date().toISOString();
}