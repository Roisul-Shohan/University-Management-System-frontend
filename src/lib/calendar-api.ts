import { apiRequest } from "./api";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  type: "class" | "exam" | "event" | "deadline";
  start: string;
  end: string;
  location?: string;
};

export const calendarApi = {
  events: () => apiRequest<CalendarEvent[]>("/api/dashboard/calendar/events"),
};