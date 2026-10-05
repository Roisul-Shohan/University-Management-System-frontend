import { apiRequest } from "./api";

export const notificationTypes = [
  "GENERAL",
  "ADMISSION",
  "REGISTRATION",
  "COURSE",
  "EXAM",
  "RESULT",
  "PAYMENT",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export const notificationsApi = {
  list: (isRead?: boolean) => {
    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (isRead !== undefined) params.set("isRead", String(isRead));
    return apiRequest<Notification[]>(`/api/notifications?${params}`);
  },
  unreadCount: () =>
    apiRequest<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: string) =>
    apiRequest<Notification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),
  markAllRead: () =>
    apiRequest<{ updatedCount: number }>("/api/notifications/read-all", {
      method: "PATCH",
    }),
};
