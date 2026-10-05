"use client";

import {
  ArrowUpRight,
  CreditCard,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../auth-provider";
import {
  admissionsApi,
  paymentsApi,
  type Admission,
  type PaymentTransaction,
} from "@/lib/payments-api";
import styles from "./payments.module.css";

const payableStatuses = new Set(["APPROVED"]);

function latestTransaction(admission: Admission) {
  return admission.transactions?.[0];
}

function formatAmount(amount: string | number) {
  return `৳${Number(amount).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const admissionsQuery = useQuery({
    queryKey: ["admissions", "mine"],
    queryFn: admissionsApi.mine,
    retry: false,
  });
  const paymentMutation = useMutation({
    mutationFn: paymentsApi.initiateAdmission,
    onSuccess: (payment) => window.location.assign(payment.bkash.bkashURL),
  });
  const admissions = admissionsQuery.data ?? [];
  const loading = checkingAccess || admissionsQuery.isPending;
  const requestError = admissionsQuery.error ?? paymentMutation.error;
  const error = requestError instanceof Error ? requestError.message : "";

  if (checkingAccess || !user) {
    return (
      <main className={styles.loading} aria-live="polite">
        Checking student access...
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student services</p>
          <h1>Payments</h1>
          <p className={styles.subtitle}>
            Complete approved admission fees securely with bKash.
          </p>
        </div>
        <div className={styles.secureBadge}>
          <ShieldCheck size={17} /> bKash secure checkout
        </div>
      </header>

      <section className={styles.notice} aria-label="Payment information">
        <CreditCard size={22} />
        <div>
          <strong>How payment works</strong>
          <p>
            Select an approved admission to open the official bKash checkout.
            Your admission is confirmed only after bKash verifies the
            transaction.
          </p>
        </div>
      </section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {loading && (
        <div className={styles.loading} aria-live="polite">
          Loading your admissions…
        </div>
      )}
      {!loading && !error && admissions.length === 0 && (
        <div className={styles.empty}>
          <GraduationCap size={28} />
          <h2>No admission applications yet</h2>
          <p>
            Your approved admissions will appear here when they are ready for
            payment.
          </p>
        </div>
      )}

      <div className={styles.grid}>
        {admissions.map((admission) => {
          const transaction = latestTransaction(admission);
          const canPay =
            payableStatuses.has(admission.status) &&
            transaction?.status !== "SUCCESS";
          const paid =
            admission.status === "CONFIRMED" ||
            transaction?.status === "SUCCESS";
          const pending =
            transaction?.status === "PENDING" && !!transaction.bkashPaymentId;
          return (
            <article className={styles.card} key={admission.id}>
              <div className={styles.cardTop}>
                <span
                  className={`${styles.status} ${styles[admission.status.toLowerCase()]}`}
                >
                  {admission.status}
                </span>
                <span className={styles.year}>{admission.admissionYear}</span>
              </div>
              <h2>
                {admission.program?.department?.name ?? "University admission"}
              </h2>
              <p>
                {admission.program?.degreeType ?? "Program details unavailable"}
              </p>
              <div className={styles.amountRow}>
                <span>Admission fee</span>
                <strong>{formatAmount(admission.admissionFee)}</strong>
              </div>
              {paid ? (
                <div className={styles.paid}>Payment completed</div>
              ) : pending && transaction ? (
                <PaymentStatus transaction={transaction} />
              ) : canPay ? (
                <button
                  className={styles.payButton}
                  onClick={() => paymentMutation.mutate(admission.id)}
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending
                    ? "Opening bKash…"
                    : "Pay with bKash"}
                  <ArrowUpRight size={17} />
                </button>
              ) : (
                <div className={styles.waiting}>
                  Payment becomes available after approval.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}

function PaymentStatus({ transaction }: { transaction: PaymentTransaction }) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ["payments", "status", transaction.id],
    queryFn: () => paymentsApi.status(transaction.id),
    enabled: transaction.status === "PENDING" && !!transaction.bkashPaymentId,
    refetchInterval: (query) =>
      query.state.data?.transaction.status === "PENDING" ? 10_000 : false,
    retry: false,
  });

  useEffect(() => {
    if (statusQuery.data?.transaction.status === "SUCCESS") {
      void queryClient.invalidateQueries({ queryKey: ["admissions", "mine"] });
    }
  }, [queryClient, statusQuery.data?.transaction.status]);

  if (statusQuery.isError) {
    return <div className={styles.waiting}>Unable to verify payment status. Please refresh.</div>;
  }

  if (statusQuery.isPending || statusQuery.data?.transaction.status === "PENDING") {
    return <div className={styles.waiting}>Checking bKash payment status…</div>;
  }

  if (statusQuery.data?.transaction.status === "SUCCESS") {
    return <div className={styles.paid}>Payment completed and verified</div>;
  }

  return <div className={styles.waiting}>Payment status: {statusQuery.data?.transaction.status ?? "Unknown"}</div>;
}
