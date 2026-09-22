"use client";

import { useCallback, useSyncExternalStore } from "react";

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Flag ใน localStorage ที่จำค่าข้าม session (ไทป์ boolean) */
export function usePersistentFlag(
  key: string
): [boolean, (v: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    useCallback(() => readFlag(key), [key]),
    useCallback(() => false, [])
  );
  const set = useCallback(
    (v: boolean) => {
      try {
        if (v) window.localStorage.setItem(key, "1");
        else window.localStorage.removeItem(key);
      } catch {
        // ignore — localStorage อาจปิดในบาง browser
      }
      emit();
    },
    [key]
  );
  return [value, set];
}