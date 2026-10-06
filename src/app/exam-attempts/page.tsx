"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, LoaderCircle, ShieldAlert } from "lucide-react";
import { useAuthGuard } from "../auth-provider";
import { examAttemptsApi } from "@/lib/exam-attempts-api";
import styles from "./exam-attempts.module.css";

export type Attempt = {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string | null;
  status: string;
  score?: number | null;
};

export default function ExamAttemptsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const queryClient = useQueryClient();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const attemptsQuery = useQuery({
    queryKey: ["exam-attempts"],
    queryFn: async () => {
      const res = await fetch("/api/exam-attempts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!res.ok) throw new Error("Failed to load attempts");
      return res.json() as Promise<Attempt[]>;
    },
    enabled: !!user,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (attemptId: string) => examAttemptsApi.submit(attemptId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exam-attempts"] });
    },
  });

  useEffect(() => {
    if (selectedAttemptId && attemptsQuery.data) {
      const attempt = attemptsQuery.data.find((a) => a.id === selectedAttemptId);
      if (attempt && attempt.status !== "IN_PROGRESS") {
        setSelectedAttemptId(null);
      }
    }
  }, [attemptsQuery.data, selectedAttemptId]);

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking student access...</main>;

  const attempts = attemptsQuery.data ?? [];

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Student services / Assessments</p>
          <h1>My exam attempts</h1>
          <p className="subtitle">Track your in-progress and completed exams.</p>
        </div>
        <ClipboardList size={27} />
      </header>

      {attemptsQuery.error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {attemptsQuery.error instanceof Error
            ? attemptsQuery.error.message
            : "Unable to load attempts."}
        </div>
      )}

      {attemptsQuery.isPending ? (
        <div className={styles.loading}>
          <LoaderCircle className="spin" size={21} /> Loading attempts...
        </div>
      ) : attempts.length === 0 ? (
        <div className="department-state">
          <ClipboardList size={25} />
          <strong>No attempts yet</strong>
        </div>
      ) : (
        <section className={styles.table}>
          {attempts.map((attempt) => (
            <div className={styles.row} key={attempt.id}>
              <div>
                <strong>Attempt {attempt.id.slice(-6)}</strong>
                <span>Exam {attempt.examId}</span>
              </div>
              <span
                className={`status-pill ${attempt.status === "IN_PROGRESS" ? "pending" : attempt.status === "GRADED" ? "active" : "inactive"}`}
              >
                {attempt.status}
              </span>
              <span>{new Date(attempt.startedAt).toLocaleString()}</span>
              {attempt.status === "IN_PROGRESS" && (
                <button
                  className="primary-button"
                  disabled={submitMutation.isPending}
                  onClick={() => submitMutation.mutate(attempt.id)}
                >
                  {submitMutation.isPending && selectedAttemptId === attempt.id
                    ? "Submitting..."
                    : "Submit"}
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
