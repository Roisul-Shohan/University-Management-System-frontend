"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthGuard } from "../../auth-provider";
import { calendarApi } from "@/lib/calendar-api";
import { Calendar, LoaderCircle, ShieldAlert } from "lucide-react";
import styles from "./calendar.module.css";

export default function CalendarPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT", "TEACHER"]);
  const eventsQuery = useQuery({
    queryKey: ["calendar", "events"],
    queryFn: calendarApi.events,
    enabled: !!user,
    retry: false,
  });

  if (checkingAccess || !user) return <main className={styles.loading}>Checking access...</main>;

  const events = eventsQuery.data ?? [];
  const loading = eventsQuery.isPending;
  const error = eventsQuery.error;

  return (
    <main className="content-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">Academics / Calendar</p>
          <h1>Academic Calendar</h1>
          <p className="subtitle">View your scheduled classes and events.</p>
        </div>
        <Calendar size={25} className="header-icon" />
      </header>

      {error && <p className={styles.error} role="alert">{error instanceof Error ? error.message : "Unable to load calendar."}</p>}

      {loading ? (
        <div className={styles.loading}><LoaderCircle className="spin" size={21} /> Loading calendar...</div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>
          <Calendar size={28} />
          <strong>No events</strong>
          <span>Your calendar will populate when classes are scheduled.</span>
        </div>
      ) : (
        <section className={styles.grid}>
          {events.map((event: any) => (
            <article key={event.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.time}`}>
                  {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`${styles.type}`}>{event.type}</span>
              </div>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              {event.location && <p className={styles.location}>{event.location}</p>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}