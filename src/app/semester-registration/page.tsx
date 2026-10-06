"use client";

import {
  CalendarCheck,
  CreditCard,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthGuard } from "../auth-provider";
import {
  semesterRegistrationApi,
  type StudentSemester,
} from "@/lib/semester-registration-api";
import styles from "./semester-registration.module.css";

const labels: Record<StudentSemester["status"], string> = {
  PENDING: "Payment required",
  REGISTERED: "Registered",
  ACTIVE: "Active semester",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  CANCELLED: "Cancelled",
};

export default function SemesterRegistrationPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: semesterRegistrationApi.profile,
    enabled: !!user,
    retry: false,
  });
  const paymentMutation = useMutation({
    mutationFn: semesterRegistrationApi.initiatePayment,
    onSuccess: (payment) => window.location.assign(payment.bkash.bkashURL),
  });

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking student access...</main>;

  const error = profileQuery.error ?? paymentMutation.error;
  const profile = profileQuery.data;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student services / Registration</p>
          <h1>Semester registration</h1>
          <p className={styles.subtitle}>
            Pay the semester fee securely with bKash to activate your
            registration.
          </p>
        </div>
        <div className={styles.icon}>
          <CalendarCheck size={25} />
        </div>
      </header>
      {error && (
        <p className={styles.error} role="alert">
          {error instanceof Error
            ? error.message
            : "Unable to load semester registration."}
        </p>
      )}
      {profileQuery.isPending ? (
        <div className={styles.loading}>
          <LoaderCircle className={styles.spin} size={21} /> Loading
          semesters...
        </div>
      ) : !profile || profile.semesters.length === 0 ? (
        <div className={styles.empty}>
          <GraduationCap size={30} />
          <strong>No semester registration is available</strong>
          <span>Your semester records will appear here when created.</span>
        </div>
      ) : (
        <>
          <section className={styles.profile}>
            <div>
              <span>Student ID</span>
              <strong>{profile.studentId}</strong>
            </div>
            <div>
              <span>Program</span>
              <strong>
                {profile.program.degreeType} · {profile.program.department.name}
              </strong>
            </div>
          </section>
          <section className={styles.grid}>
            {profile.semesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                pending={paymentMutation.isPending}
                onPay={() => paymentMutation.mutate(semester.id)}
              />
            ))}
          </section>
        </>
      )}
      <div className={styles.note}>
        <ShieldCheck size={17} />
        <span>
          bKash opens in a secure checkout. Registration is activated only after
          payment verification.
        </span>
      </div>
    </main>
  );
}

function SemesterCard({
  semester,
  pending,
  onPay,
}: {
  semester: StudentSemester;
  pending: boolean;
  onPay: () => void;
}) {
  const payable = semester.status === "PENDING";
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span
          className={`${styles.status} ${styles[semester.status.toLowerCase()]}`}
        >
          {labels[semester.status]}
        </span>
        <span>
          Year {semester.year} · Semester {semester.semester}
        </span>
      </div>
      <h2>Semester {semester.semester}</h2>
      <p>Academic year {semester.year}</p>
      {payable ? (
        <button className={styles.payButton} onClick={onPay} disabled={pending}>
          <CreditCard size={17} />
          {pending ? "Opening bKash..." : "Pay semester fee with bKash"}
        </button>
      ) : (
        <div className={styles.completed}>
          <ShieldCheck size={17} />
          {labels[semester.status]}
        </div>
      )}
    </article>
  );
}
