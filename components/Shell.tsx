"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "~/lib/auth";
import AppShell from "./AppShell";
import { FullscreenLoader } from "./ui";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut" && pathname !== "/login") {
      router.replace("/login");
    }
    if (status === "signedIn" && pathname === "/login") {
      router.replace("/");
    }
  }, [status, pathname, router]);

  if (status === "loading") return <FullscreenLoader />;
  if (status === "signedOut") {
    return pathname === "/login" ? <>{children}</> : <FullscreenLoader />;
  }
  if (pathname === "/login") return <FullscreenLoader />;
  return <AppShell>{children}</AppShell>;
}