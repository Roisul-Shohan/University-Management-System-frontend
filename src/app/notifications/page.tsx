"use client";

import { Bell, CheckCheck, Inbox, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../auth-provider";
import { notificationsApi, type Notification } from "@/lib/notifications-api";
import styles from "./notifications.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const { user, loading: checkingAccess } = useAuthGuard([
    "STUDENT",
    "TEACHER",
    "SUPER_ADMIN",
  ]);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notificationsQuery = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => notificationsApi.list(filter === "unread" ? false : undefined),
    enabled: !!user,
    retry: false,
  });
  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    enabled: !!user,
    retry: false,
  });
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => refreshNotifications(queryClient),
  });
  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => refreshNotifications(queryClient),
  });

  if (checkingAccess || !user) {
    return <main className={styles.loading}>Checking notification access...</main>;
  }

  const error = notificationsQuery.error ?? unreadQuery.error;
  const notifications = notificationsQuery.data ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Workspace / Updates</p>
          <h1>Notifications</h1>
          <p className={styles.subtitle}>Stay up to date with important university activity.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.unreadBadge}>{unreadQuery.data?.count ?? 0} unread</span>
          <button
            className={styles.markAll}
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || unreadQuery.data?.count === 0}
          >
            <CheckCheck size={16} />
            {markAllMutation.isPending ? "Updating..." : "Mark all read"}
          </button>
        </div>
      </header>

      <div className={styles.toolbar} role="tablist" aria-label="Notification filter">
        <button className={filter === "all" ? styles.activeTab : ""} onClick={() => setFilter("all")} role="tab" aria-selected={filter === "all"}>
          All notifications
        </button>
        <button className={filter === "unread" ? styles.activeTab : ""} onClick={() => setFilter("unread")} role="tab" aria-selected={filter === "unread"}>
          Unread
        </button>
      </div>

      {error && <p className={styles.error} role="alert">{error instanceof Error ? error.message : "Unable to load notifications."}</p>}
      {notificationsQuery.isPending ? (
        <div className={styles.loading}><LoaderCircle className={styles.spin} size={21} /> Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}><Inbox size={30} /><h2>You&apos;re all caught up</h2><p>No notifications match this filter.</p></div>
      ) : (
        <section className={styles.list} aria-label="Notifications">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} onRead={() => markReadMutation.mutate(notification.id)} marking={markReadMutation.isPending} />
          ))}
        </section>
      )}
    </main>
  );
}

function NotificationCard({
  notification,
  onRead,
  marking,
}: {
  notification: Notification;
  onRead: () => void;
  marking: boolean;
}) {
  return (
    <article className={`${styles.card} ${notification.isRead ? styles.read : styles.unread}`}>
      <div className={styles.icon}><Bell size={18} /></div>
      <div className={styles.copy}>
        <div className={styles.cardHeading}><span className={styles.type}>{notification.type}</span><time>{formatDate(notification.createdAt)}</time></div>
        <h2>{notification.title}</h2>
        <p>{notification.message}</p>
      </div>
      {!notification.isRead && <button className={styles.readButton} onClick={onRead} disabled={marking}>Mark read</button>}
    </article>
  );
}

function refreshNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
}
