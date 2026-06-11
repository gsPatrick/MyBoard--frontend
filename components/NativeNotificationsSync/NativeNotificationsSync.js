"use client";

import { useEffect, useRef } from "react";
import { isNative, requestNotificationPermission, setBadge, notify } from "@/lib/nativeBridge";
import { getUnreadCount, listNotifications } from "@/services/notifications";

/**
 * No app nativo (Mac): mantém o badge do Dock com o nº de notificações não lidas
 * e dispara notificação nativa quando chega algo novo. Na web pura, não faz nada.
 */
export default function NativeNotificationsSync() {
  const lastCount = useRef(null);

  useEffect(() => {
    if (!isNative()) return undefined;

    requestNotificationPermission();
    let stopped = false;

    async function tick() {
      try {
        const res = await getUnreadCount();
        const count = typeof res === "number" ? res : res?.count ?? res?.unread ?? 0;
        setBadge(count);

        if (lastCount.current != null && count > lastCount.current) {
          try {
            const data = await listNotifications({ unread: "true", limit: 1 });
            const items = data?.items || (Array.isArray(data) ? data : []);
            const top = items[0];
            notify(top?.title || "MyBoard", top?.message || `Você tem ${count} novas notificações.`);
          } catch {
            notify("MyBoard", `Você tem ${count} novas notificações.`);
          }
        }
        lastCount.current = count;
      } catch {
        /* offline / sem sessão — ignora */
      }
    }

    tick();
    const timer = window.setInterval(() => {
      if (!stopped) tick();
    }, 60000);

    function onRefresh() {
      if (!stopped) tick();
    }
    window.addEventListener("myboard:workspace-refresh", onRefresh);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("myboard:workspace-refresh", onRefresh);
    };
  }, []);

  return null;
}
