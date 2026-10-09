"use client";

import { Check, ClipboardCheck, Filter, LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../../auth-provider";
import {
  admissionsApi,
  type AdmissionStatus,
  type ReviewAdmission,
} from "@/lib/admissions-api";
import styles from "./admission-review.module.css";

const statuses: Array<AdmissionStatus | ""> = [
  "",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CONFIRMED",
  "CANCELLED",
];

export default function AdmissionReviewPage() {
  const { user, loading: checkingAccess } = useAuthGuard([
    "SUPER_ADMIN",
    "TEACHER",
  ]);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AdmissionStatus | "">("PENDING");
  const [year, setYear] = useState("");
  const reviewQuery = useQuery({
    queryKey: ["admissions", "review", status, year],
    queryFn: () =>
      admissionsApi.reviewList({
        status: status || undefined,
        admissionYear: year ? Number(year) : undefined,
      }),
    enabled: !!user,
    retry: false,
  });
  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) =>
      action === "approve"
        ? admissionsApi.approve(id)
        : admissionsApi.reject(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admissions", "review"] }),
  });

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking reviewer access...</main>;

  const error = reviewQuery.error ?? reviewMutation.error;
  const admissions = reviewQuery.data ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admissions / Review</p>
          <h1>Admission review</h1>
          <p className={styles.subtitle}>
            Review applications within your authorized university scope.
          </p>
        </div>
        <div className={styles.icon}>
          <ClipboardCheck size={25} />
        </div>
      </header>
      <section className={styles.toolbar} aria-label="Admission filters">
        <Filter size={17} />
        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdmissionStatus | "")
            }
          >
            {statuses.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All statuses"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="">All years</option>
            {[2026, 2025, 2024, 2023, 2022].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.count}>{admissions.length} applications</span>
      </section>
      {error && (
        <p className={styles.error} role="alert">
          {error instanceof Error
            ? error.message
            : "Unable to load admissions."}
        </p>
      )}
      {reviewQuery.isPending ? (
        <div className={styles.loading}>
          <LoaderCircle className={styles.spin} size={21} /> Loading
          applications...
        </div>
      ) : admissions.length === 0 ? (
        <div className={styles.empty}>
          <ClipboardCheck size={30} />
          <strong>No applications found</strong>
          <span>Try another status or year filter.</span>
        </div>
      ) : (
        <section className={styles.grid}>
          {admissions.map((admission) => (
            <ReviewCard
              key={admission.id}
              admission={admission}
              pending={reviewMutation.isPending}
              onAction={(action) =>
                reviewMutation.mutate({ id: admission.id, action })
              }
            />
          ))}
        </section>
      )}
    </main>
  );
}

function ReviewCard({
  admission,
  pending,
  onAction,
}: {
  admission: ReviewAdmission;
  pending: boolean;
  onAction: (action: "approve" | "reject") => void;
}) {
  const canReview = admission.status === "PENDING";
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span
          className={`${styles.status} ${styles[admission.status.toLowerCase()]}`}
        >
          {admission.status}
        </span>
        <span>{admission.admissionYear}</span>
      </div>
      <h2>{admission.user.name}</h2>
      <p>{admission.user.email}</p>
      <div className={styles.program}>
        <strong>{admission.program.degreeType}</strong>
        <span>{admission.program.department.name}</span>
      </div>
      {canReview && (
        <div className={styles.actions}>
          <button
            className={styles.reject}
            disabled={pending}
            onClick={() => onAction("reject")}
          >
            <X size={15} /> Reject
          </button>
          <button
            className={styles.approve}
            disabled={pending}
            onClick={() => onAction("approve")}
          >
            <Check size={15} /> Approve
          </button>
        </div>
      )}
    </article>
  );
}
