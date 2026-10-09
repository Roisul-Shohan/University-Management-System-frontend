"use client";

import {
  BookOpen,
  CreditCard,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../../auth-provider";
import { semesterRegistrationApi } from "@/lib/semester-registration-api";
import {
  courseRegistrationApi,
  type RegistrationOffering,
} from "@/lib/course-registration-api";
import styles from "./course-registration.module.css";

export default function CourseRegistrationPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const queryClient = useQueryClient();
  const [semesterId, setSemesterId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: semesterRegistrationApi.profile,
    enabled: !!user,
    retry: false,
  });
  const registeredSemesters =
    profileQuery.data?.semesters.filter(
      (semester) => semester.status === "REGISTERED",
    ) ?? [];
  const activeSemesterId = semesterId || registeredSemesters[0]?.id || "";
  const offeringsQuery = useQuery({
    queryKey: ["course-registration", "offerings", activeSemesterId],
    queryFn: () => courseRegistrationApi.available(activeSemesterId),
    enabled: !!activeSemesterId,
    retry: false,
  });
  const registerMutation = useMutation({
    mutationFn: (offeringId: string) =>
      courseRegistrationApi.register(activeSemesterId, offeringId),
    onSuccess: (_result, offeringId) => {
      setSelectedIds((current) =>
        current.includes(offeringId) ? current : [...current, offeringId],
      );
      void queryClient.invalidateQueries({
        queryKey: ["course-registration", "offerings", activeSemesterId],
      });
    },
  });
  const dropMutation = useMutation({
    mutationFn: (offeringId: string) =>
      courseRegistrationApi.drop(activeSemesterId, offeringId),
    onSuccess: (_result, offeringId) => {
      setSelectedIds((current) => current.filter((id) => id !== offeringId));
      void queryClient.invalidateQueries({
        queryKey: ["course-registration", "offerings", activeSemesterId],
      });
    },
  });
  const paymentMutation = useMutation({
    mutationFn: () => courseRegistrationApi.initiatePayment(activeSemesterId),
    onSuccess: (payment) => window.location.assign(payment.bkash.bkashURL),
  });

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking student access...</main>;
  const error =
    profileQuery.error ??
    offeringsQuery.error ??
    registerMutation.error ??
    dropMutation.error ??
    paymentMutation.error;
  const selectedTotal = (offeringsQuery.data ?? [])
    .filter((offering) => selectedIds.includes(offering.id))
    .reduce((total, offering) => total + offering.course.credits, 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student services / Courses</p>
          <h1>Course registration</h1>
          <p className={styles.subtitle}>
            Select courses for a registered semester, then complete the bKash
            registration payment.
          </p>
        </div>
        <div className={styles.icon}>
          <BookOpen size={25} />
        </div>
      </header>
      {error && (
        <p className={styles.error} role="alert">
          {error instanceof Error
            ? error.message
            : "Unable to load course registration."}
        </p>
      )}
      {profileQuery.isPending ? (
        <div className={styles.loading}>
          <LoaderCircle className={styles.spin} size={21} /> Loading
          semesters...
        </div>
      ) : registeredSemesters.length === 0 ? (
        <div className={styles.empty}>
          <GraduationCap size={30} />
          <strong>No registered semester found</strong>
          <span>Complete semester registration before selecting courses.</span>
        </div>
      ) : (
        <>
          <section className={styles.controls}>
            <label>
              Registered semester
              <select
                value={activeSemesterId}
                onChange={(event) => {
                  setSemesterId(event.target.value);
                  setSelectedIds([]);
                }}
              >
                <option value="">Choose a semester</option>
                {registeredSemesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    Year {semester.year} · Semester {semester.semester}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.summary}>
              <strong>{selectedIds.length} courses</strong>
              <span>{selectedTotal} credits selected</span>
            </div>
          </section>
          {offeringsQuery.isPending ? (
            <div className={styles.loading}>
              <LoaderCircle className={styles.spin} size={21} /> Loading
              available courses...
            </div>
          ) : (
            <section className={styles.grid}>
              {(offeringsQuery.data ?? []).map((offering) => (
                <OfferingCard
                  key={offering.id}
                  offering={offering}
                  selected={selectedIds.includes(offering.id)}
                  busy={registerMutation.isPending || dropMutation.isPending}
                  onToggle={() =>
                    selectedIds.includes(offering.id)
                      ? dropMutation.mutate(offering.id)
                      : registerMutation.mutate(offering.id)
                  }
                />
              ))}
            </section>
          )}
          {(offeringsQuery.data?.length ?? 0) > 0 && (
            <button
              className={styles.payButton}
              onClick={() => paymentMutation.mutate()}
              disabled={selectedIds.length === 0 || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                "Opening bKash..."
              ) : (
                <>
                  <CreditCard size={17} /> Pay course registration with bKash
                </>
              )}
            </button>
          )}
        </>
      )}
      <div className={styles.note}>
        <ShieldCheck size={17} />
        <span>
          Course selections stay pending until the course-registration fee is
          verified by bKash.
        </span>
      </div>
    </main>
  );
}

function OfferingCard({
  offering,
  selected,
  busy,
  onToggle,
}: {
  offering: RegistrationOffering;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const full =
    offering.capacity !== null &&
    (offering._count?.enrollments ?? 0) >= offering.capacity;
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <div className={styles.cardTop}>
        <span>{offering.course.code}</span>
        <span>{offering.course.credits} credits</span>
      </div>
      <h2>{offering.course.name}</h2>
      <p>Instructor: {offering.teacher.user.name}</p>
      <span className={styles.capacity}>
        {offering._count?.enrollments ?? 0}
        {offering.capacity ? ` / ${offering.capacity}` : ""} enrolled
      </span>
      <button
        className={selected ? styles.dropButton : styles.selectButton}
        onClick={onToggle}
        disabled={busy || (!selected && full)}
      >
        {selected ? "Remove selection" : full ? "Course full" : "Select course"}
      </button>
    </article>
  );
}
