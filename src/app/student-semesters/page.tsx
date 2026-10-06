"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, LoaderCircle, ShieldAlert } from "lucide-react";
import { useAuthGuard } from "../auth-provider";
import { studentSemestersApi, type InitiatePaymentResponse } from "@/lib/student-semesters-api";
import styles from "./student-semesters.module.css";

export default function StudentSemestersPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");

  const semestersQuery = useQuery({
    queryKey: ["student-semesters"],
    queryFn: async () => {
      const res = await fetch("/api/student-semesters", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!res.ok) throw new Error("Failed to load semesters");
      return res.json();
    },
    enabled: !!user,
    retry: false,
  });

  const paymentMutation = useMutation({
    mutationFn: (studentSemesterId: string) =>
      studentSemestersApi.initiatePayment(studentSemesterId),
    onSuccess: (data: InitiatePaymentResponse) => {
      if (data.bkashURL) {
        window.location.assign(data.bkashURL);
      }
    },
  });

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking student access...</main>;

  const semesters = semestersQuery.data ?? [];

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Student services / Academic</p>
          <h1>My semesters</h1>
          <p className="subtitle">
            View your semesters and pay semester fees.
          </p>
        </div>
      </header>

      {paymentError && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {paymentError}
        </div>
      )}

      {semestersQuery.isPending ? (
        <div className={styles.loading}>
          <LoaderCircle className="spin" size={21} /> Loading semesters...
        </div>
      ) : semesters.length === 0 ? (
        <div className="department-state">
          <CreditCard size={25} />
          <strong>No semesters found</strong>
        </div>
      ) : (
        <section className={styles.grid}>
          {semesters.map((semester: any) => (
            <article className={styles.card} key={semester.id}>
              <div className={styles.cardTop}>
                <span className={styles.semesterLabel}>
                  Year {semester.year} · Semester {semester.semester}
                </span>
                <span className={`status-pill ${semester.status === "ACTIVE" ? "active" : "inactive"}`}>
                  {semester.status}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  className="primary-button"
                  disabled={paymentMutation.isPending}
                  onClick={() => {
                    setSelectedSemester(semester.id);
                    setPaymentError("");
                    paymentMutation.mutate(semester.id);
                  }}
                >
                  {paymentMutation.isPending && selectedSemester === semester.id
                    ? "Processing..."
                    : "Pay semester fee"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
