"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFBAuth, ensureAuthPersistence, hasFirebaseConfig } from "./firebase";
import { enableOffline } from "./firebase";

export type AuthStatus = "loading" | "signedIn" | "signedOut";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: ErrorKey | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type ErrorKey =
  | "errInvalidCredential"
  | "errInvalidEmail"
  | "errUserNotFound"
  | "errWrongPassword"
  | "errEmailInUse"
  | "errWeakPassword"
  | "errTooMany"
  | "errNetwork"
  | "errPopup"
  | "errDomain"
  | "errGeneric";
export type { ErrorKey };

function mapError(err: unknown): ErrorKey {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, ErrorKey> = {
    "auth/invalid-credential": "errInvalidCredential",
    "auth/invalid-email": "errInvalidEmail",
    "auth/user-not-found": "errUserNotFound",
    "auth/wrong-password": "errWrongPassword",
    "auth/email-already-in-use": "errEmailInUse",
    "auth/weak-password": "errWeakPassword",
    "auth/too-many-requests": "errTooMany",
    "auth/network-request-failed": "errNetwork",
    "auth/popup-closed-by-user": "errPopup",
    "auth/unauthorized-domain": "errDomain",
  };
  return map[code] ?? "errGeneric";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasFirebaseConfig ? "loading" : "signedOut"
  );
  const [error, setError] = useState<ErrorKey | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) return;
    ensureAuthPersistence();
    const unsub = onAuthStateChanged(getFBAuth(), (u) => {
      setUser(u);
      setStatus(u ? "signedIn" : "signedOut");
    });
    enableOffline();
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(getFBAuth(), new GoogleAuthProvider());
    } catch (err) {
      setError(mapError(err));
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(getFBAuth(), email, password);
    } catch (err) {
      setError(mapError(err));
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        const cred = await createUserWithEmailAndPassword(
          getFBAuth(),
          email,
          password
        );
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } catch (err) {
        setError(mapError(err));
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await fbSignOut(getFBAuth());
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, status, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  return ctx;
}