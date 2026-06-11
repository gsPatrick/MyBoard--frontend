"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth";

const LOGOUT_DURATION_MS = 1400;

export function useAnimatedLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutAnimated = useCallback(() => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    window.setTimeout(() => {
      logout();
      router.replace("/login?logout=1");
    }, LOGOUT_DURATION_MS);
  }, [isLoggingOut, router]);

  return { isLoggingOut, logoutAnimated, logoutDurationMs: LOGOUT_DURATION_MS };
}
