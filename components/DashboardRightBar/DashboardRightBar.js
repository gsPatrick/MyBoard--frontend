"use client";

import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar/Avatar";
import RightBarEmpty, { RightBarLoading } from "@/components/RightBarEmpty/RightBarEmpty";
import Button from "@/components/Button/Button";
import { listNotifications } from "@/api/notifications";
import { listActivities } from "@/api/activities";
import { listClients } from "@/api/clients";
import { normalizeListResponse } from "@/lib/apiList";
import { ensureActiveTenant } from "@/lib/tenantContext";
import { getClientAvatarUrl, getUserAvatarUrl } from "@/lib/mediaUrl";
import { formatRelativeTime, getDateFromApi } from "@/lib/formatRelativeTime";
import { getNotificationPresentation } from "@/lib/notificationPresentation";
import { useDashboardNav } from "@/context/DashboardNavContext";
import { useDashboardTab } from "@/context/DashboardTabContext";
import styles from "./DashboardRightBar.module.css";

function NotificationIcon({ type }) {
  if (type === "user") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.1" />
        <path
          d="M4 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "broadcast") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3 8h2l2-4v8l-2-4H3Z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M10 5.5a2.5 2.5 0 0 1 0 5"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 6.5c0-1.7 1.3-3 3-3s3 1.3 3 3c0 2 1 3 1.5 3.5H3.5C4 9.5 5 8.5 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M7 11.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardRightBar() {
  const { selectClient } = useDashboardNav();
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [clients, setClients] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const loadData = useCallback(async () => {
    setLoadingNotifications(true);
    setLoadingActivities(true);
    setLoadingClients(true);

    try {
      await ensureActiveTenant();
      const [notificationsData, activitiesData, clientsData] = await Promise.all([
        listNotifications({ limit: 5 }),
        listActivities({ limit: 5 }),
        listClients({ limit: 200, include_inactive: "true" }),
      ]);

      setNotifications(normalizeListResponse(notificationsData).slice(0, 5));
      setActivities(normalizeListResponse(activitiesData).slice(0, 5));
      setClients(normalizeListResponse(clientsData));
    } catch {
      setNotifications([]);
      setActivities([]);
      setClients([]);
    } finally {
      setLoadingNotifications(false);
      setLoadingActivities(false);
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("myboard:workspace-refresh", loadData);
    return () => window.removeEventListener("myboard:workspace-refresh", loadData);
  }, [loadData]);

  function handleClientClick(client) {
    selectClient(client);
  }

  const showActivityLine = activities.length > 1;

  return (
    <aside className={styles.rightBar}>
      <section className={styles.block}>
        <h2 className={styles.title}>
          Notifications
          {!loadingNotifications && notifications.length > 0 && (
            <span className={styles.count}>{notifications.length}</span>
          )}
        </h2>
        {loadingNotifications && <RightBarLoading rows={3} />}
        {!loadingNotifications && notifications.length === 0 && (
          <RightBarEmpty variant="notifications" />
        )}
        {!loadingNotifications &&
          notifications.map((item) => {
            const presentation = getNotificationPresentation(item.event_type);
            const label = item.message || item.title;
            const when = formatRelativeTime(
              getDateFromApi(item.created_at_display) || item.created_at
            );

            return (
              <article key={item.id} className={styles.feedItem}>
                <span className={`${styles.iconWrap} ${styles[presentation.iconBg]}`}>
                  <NotificationIcon type={presentation.icon} />
                </span>
                <div className={styles.feedText}>
                  <p className={styles.feedTitle}>{label}</p>
                  {when && <p className={styles.feedTime}>{when}</p>}
                </div>
              </article>
            );
          })}
      </section>

      <section className={`${styles.block} ${styles.activities}`}>
        <h2 className={styles.title}>
          Activities
          {!loadingActivities && activities.length > 0 && (
            <span className={styles.count}>{activities.length}</span>
          )}
        </h2>
        {loadingActivities && <RightBarLoading rows={3} variant="feed" />}
        {!loadingActivities && activities.length === 0 && (
          <RightBarEmpty variant="activities" />
        )}
        {!loadingActivities && activities.length > 0 && (
          <div className={styles.timelineWrap}>
            {showActivityLine && <div className={styles.timelineLine} aria-hidden="true" />}
            {activities.map((item) => {
              const when = formatRelativeTime(
                getDateFromApi(item.created_at_display) || item.created_at
              );
              const userName = item.user?.name || "Você";

              return (
                <article key={item.id} className={styles.activityItem}>
                  <Avatar
                    src={getUserAvatarUrl(item.user)}
                    name={userName}
                    size="sm"
                  />
                  <div className={styles.feedText}>
                    <p className={styles.feedTitle}>{item.title}</p>
                    {when && <p className={styles.feedTime}>{when}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${styles.block} ${styles.contactsBlock}`}>
        <h2 className={styles.title}>
          Clientes
          {!loadingClients && clients.length > 0 && (
            <span className={styles.count}>{clients.length}</span>
          )}
        </h2>
        {loadingClients && <RightBarLoading rows={4} variant="contact" />}
        {!loadingClients && clients.length === 0 && (
          <RightBarEmpty
            variant="contacts"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab("clientes")}
              >
                Ver clientes
              </Button>
            }
          />
        )}
        {!loadingClients && clients.length > 0 && (
          <div className={styles.contactsScroll}>
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={styles.contactItem}
                onClick={() => handleClientClick(client)}
              >
                <Avatar src={getClientAvatarUrl(client)} name={client.name} size="md" />
                <span className={styles.contactBody}>
                  <span className={styles.contactName}>{client.name}</span>
                  {client.email && (
                    <span className={styles.contactMeta}>{client.email}</span>
                  )}
                  {client.phone && (
                    <span className={styles.contactMeta}>{client.phone}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
