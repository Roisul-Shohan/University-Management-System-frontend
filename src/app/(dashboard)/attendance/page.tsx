"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  ShieldAlert,
  X,
  LoaderCircle,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuthGuard } from "../../auth-provider";
import { attendanceApi, type AttendanceSession } from "@/lib/attendance-api";
import { classSessionsApi, type ClassSession } from "@/lib/class-sessions-api";
import styles from "./attendance.module.css";

const openSessionSchema = z.object({
  classSessionId: z.string().min(1, "Choose a class session."),
  durationMinutes: z.coerce.number().int().positive().max(240).optional(),
});

type OpenSessionValues = z.infer<typeof openSessionSchema>;

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

const recordStatusLabels: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export default function AttendancePage() {
  const { user, loading: checkingAccess } = useAuthGuard([
    "SUPER_ADMIN",
    "TEACHER",
    "STUDENT",
  ]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"open" | "mark" | null>(null);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isTeacher = user?.role === "TEACHER" || user?.role === "SUPER_ADMIN";
  const isStudent = user?.role === "STUDENT";

  async function loadSessions() {
    setLoading(true);
    setError("");
    try {
      const data = await attendanceApi.listSessions();
      setSessions(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load attendance sessions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    if (isTeacher) {
      Promise.all([attendanceApi.listSessions(), classSessionsApi.list()])
        .then(([sessionResult, classSessionResult]) => {
          setSessions(sessionResult);
          setClassSessions(classSessionResult);
          setLoading(false);
        })
        .catch((requestError) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load attendance data.",
          );
          setLoading(false);
        });
    }
  }, [user]);

  const openForm = useForm<OpenSessionValues>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: { classSessionId: "", durationMinutes: 30 },
  });

  async function submitOpenSession(values: OpenSessionValues) {
    setError("");
    try {
      await attendanceApi.openSession(values);
      setModal(null);
      openForm.reset();
      void loadSessions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to open attendance session.",
      );
    }
  }

  async function closeSession(sessionId: string) {
    setActionLoading(sessionId);
    setError("");
    try {
      await attendanceApi.closeSession(sessionId);
      void loadSessions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to close session.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function markAttendance(sessionId: string, qrToken: string) {
    setActionLoading(sessionId);
    setError("");
    try {
      await attendanceApi.markAttendance(sessionId, qrToken);
      setModal(null);
      void loadSessions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to mark attendance.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function updateRecordStatus(
    sessionId: string,
    recordId: string,
    status: string,
  ) {
    setActionLoading(recordId);
    setError("");
    try {
      await attendanceApi.updateRecord(sessionId, recordId, status);
      if (selectedSession) {
        const updated = await attendanceApi.getSession(selectedSession.id);
        setSelectedSession(updated);
        void loadSessions();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update attendance record.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking access...</main>;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Attendance</p>
          <h1>Attendance</h1>
          <p className="subtitle">
            Manage class attendance sessions and records.
          </p>
        </div>
        {isTeacher && (
          <button className="primary-button" onClick={() => setModal("open")}>
            <Plus size={17} /> Open session
          </button>
        )}
      </header>

      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <LoaderCircle className="spin" size={21} /> Loading...
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.empty}>
          <Clock size={25} />
          <strong>No attendance sessions</strong>
          <span>
            {isTeacher
              ? "Open a new attendance session to get started."
              : "No attendance sessions available."}
          </span>
        </div>
      ) : (
        <section className={styles.list}>
          {sessions.map((session) => (
            <article className={styles.card} key={session.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>
                    {session.classSession?.courseOffering?.course?.code ??
                      "Class session"}
                  </h3>
                  <span>
                    {session.classSession?.courseOffering?.course?.name}
                  </span>
                </div>
                <span
                  className={`status-pill ${
                    session.status === "OPEN"
                      ? "active"
                      : session.status === "CLOSED"
                        ? "inactive"
                        : "pending"
                  }`}
                >
                  {statusLabels[session.status] ?? session.status}
                </span>
              </div>
              <div className={styles.meta}>
                <span>
                  Opened:{" "}
                  {new Date(session.openedAt).toLocaleString()}
                </span>
                <span>
                  Expires:{" "}
                  {new Date(session.expiresAt).toLocaleString()}
                </span>
              </div>
              {isTeacher && session.status === "OPEN" && (
                <div className={styles.actions}>
                  <button
                    className={styles.closeButton}
                    disabled={actionLoading === session.id}
                    onClick={() => closeSession(session.id)}
                  >
                    {actionLoading === session.id ? (
                      <LoaderCircle className="spin" size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Close session
                  </button>
                  <button
                    className={styles.viewButton}
                    onClick={() => setSelectedSession(session)}
                  >
                    View records
                  </button>
                </div>
              )}
              {isStudent && session.status === "OPEN" && (
                <div className={styles.actions}>
                  <button
                    className={styles.markButton}
                    disabled={actionLoading === session.id}
                    onClick={() => {
                      setSelectedSession(session);
                      setModal("mark");
                    }}
                  >
                    <QrCode size={14} />
                    Mark attendance
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {modal === "open" && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Attendance</p>
                <h2>Open attendance session</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="period-form" onSubmit={openForm.handleSubmit(submitOpenSession)}>
              <label>
                Class session
                <select {...openForm.register("classSessionId")}>
                  <option value="">Choose a class session</option>
                  {classSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.courseOffering?.course?.code ?? "Session"}
                      {session.topic ? ` · ${session.topic}` : ""}
                    </option>
                  ))}
                </select>
                {openForm.formState.errors.classSessionId && (
                  <span className="field-error">
                    {openForm.formState.errors.classSessionId.message}
                  </span>
                )}
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  {...openForm.register("durationMinutes")}
                  placeholder="30"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={openForm.formState.isSubmitting}
                >
                  {openForm.formState.isSubmitting ? "Opening..." : "Open session"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modal === "mark" && selectedSession && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Attendance</p>
                <h2>Mark attendance</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <MarkAttendanceForm
              sessionId={selectedSession.id}
              onSubmit={markAttendance}
              onClose={() => setModal(null)}
              error={error}
            />
          </section>
        </div>
      )}

      {selectedSession && !modal && isTeacher && (
        <div className="modal-backdrop">
          <section className="period-modal" style={{ maxWidth: "min(90vw, 900px)" }}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Attendance records</p>
                <h2>
                  {selectedSession.classSession?.courseOffering?.course?.code ??
                    "Session"}
                </h2>
              </div>
              <button className="close-button" onClick={() => setSelectedSession(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.recordList}>
              {(selectedSession.attendanceRecords ?? []).length === 0 ? (
                <div className={styles.emptyRecord}>
                  <Clock size={20} />
                  <span>No records yet</span>
                </div>
              ) : (
                selectedSession.attendanceRecords?.map((record) => (
                  <div className={styles.recordRow} key={record.id}>
                    <div>
                      <strong>
                        {record.courseEnrollment.studentSemester.student.user.name}
                      </strong>
                      <span>
                        {record.courseEnrollment.studentSemester.student.studentId}
                      </span>
                    </div>
                    <span
                      className={`status-pill ${
                        record.status === "PRESENT"
                          ? "active"
                          : record.status === "ABSENT"
                            ? "inactive"
                            : "pending"
                      }`}
                    >
                      {recordStatusLabels[record.status] ?? record.status}
                    </span>
                    {isTeacher && (
                      <div className={styles.recordActions}>
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                          <button
                            key={status}
                            className={styles.recordButton}
                            disabled={actionLoading === record.id}
                            onClick={() =>
                              updateRecordStatus(selectedSession.id, record.id, status)
                            }
                          >
                            {record.status === status && <CheckCircle2 size={14} />}
                            {recordStatusLabels[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function MarkAttendanceForm({
  sessionId,
  onSubmit,
  onClose,
  error,
}: {
  sessionId: string;
  onSubmit: (sessionId: string, qrToken: string) => void;
  onClose: () => void;
  error: string;
}) {
  const [qrToken, setQrToken] = useState("");

  return (
    <form
      className="period-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(sessionId, qrToken);
      }}
    >
      <label>
        QR Token
        <input
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          placeholder="Enter QR token"
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={!qrToken}
        >
          Mark attendance
        </button>
      </div>
    </form>
  );
}
