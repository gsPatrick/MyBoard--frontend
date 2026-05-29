"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import IconButton from "@/components/IconButton/IconButton";
import {
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "@/api/notifications";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import styles from "./NotificationsDropdown.module.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6.5a4 4 0 1 1 8 0c0 3 1 4 1.5 4.5H2.5C3 10.5 4 9.5 4 6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 12.5a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NotificationsDropdown() {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      await ensureActiveTenant();
      const data = await getUnreadCount();
      const count = data?.count ?? 0;
      setUnreadCount(Number(count) || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await ensureActiveTenant();
      const data = await listNotifications({ limit: 20 });
      setItems(normalizeListResponse(data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const onRefresh = () => loadUnread();
    window.addEventListener("myboard:workspace-refresh", onRefresh);
    return () => window.removeEventListener("myboard:workspace-refresh", onRefresh);
  }, [loadUnread]);

  useEffect(() => {
    if (!open) return;
    loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleItemClick(notification) {
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id);
        setItems((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        /* ignore */
      }
    }
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <IconButton
        label="Notificações"
        size="md"
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
      </IconButton>
      {unreadCount > 0 && <span className={styles.badge} aria-hidden="true" />}

      {open && (
        <div className={styles.dropdown} role="menu" aria-label="Notificações">
          <div className={styles.header}>
            <span className={styles.title}>Notificações</span>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAll} onClick={handleMarkAll}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && <p className={styles.loading}>Carregando...</p>}
            {!loading && items.length === 0 && (
              <p className={styles.empty}>Nenhuma notificação</p>
            )}
            {!loading &&
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`${styles.item} ${!item.read_at ? styles.itemUnread : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.message && <span className={styles.itemMessage}>{item.message}</span>}
                  <span className={styles.itemTime}>
                    {item.created_at_display || item.created_at || ""}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
