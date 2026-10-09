"use client";

import {
  FileText,
  GraduationCap,
  LoaderCircle,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../../auth-provider";
import { programsApi, type Program } from "@/lib/api";
import { admissionsApi, type StudentAdmission } from "@/lib/admissions-api";
import styles from "./admissions.module.css";

const admissionSchema = z.object({
  programId: z.string().min(1, "Choose a program."),
  admissionYear: z
    .string()
    .refine((value) => /^\d{4}$/.test(value), "Enter a four-digit year.")
    .refine(
      (value) => Number(value) >= 2000 && Number(value) <= 2100,
      "Enter a year between 2000 and 2100.",
    ),
});

type AdmissionValues = z.infer<typeof admissionSchema>;

const statusLabels: Record<StudentAdmission["status"], string> = {
  PENDING: "Awaiting review",
  APPROVED: "Ready for payment",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export default function AdmissionsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const queryClient = useQueryClient();
  const admissionsQuery = useQuery({
    queryKey: ["admissions", "mine"],
    queryFn: admissionsApi.mine,
    enabled: !!user,
    retry: false,
  });
  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => programsApi.list(),
    enabled: !!user,
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: admissionsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admissions", "mine"] });
      reset();
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      programId: "",
      admissionYear: String(new Date().getFullYear()),
    },
  });

  if (checkingAccess || !user) {
    return <main className={styles.loading}>Checking student access...</main>;
  }

  const requestError =
    admissionsQuery.error ?? programsQuery.error ?? createMutation.error;
  const admissions = admissionsQuery.data ?? [];
  const programs = programsQuery.data ?? [];

  // Filter programs to only show programs from student's department
  const studentDeptId = user?.student?.program?.department?.id;
  const filteredPrograms = studentDeptId
    ? programs.filter((p) => p.departmentId === studentDeptId)
    : programs;

  function submit(values: AdmissionValues) {
    createMutation.mutate({
      programId: values.programId,
      admissionYear: Number(values.admissionYear),
    });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Student services / Admissions</p>
          <h1>My admissions</h1>
          <p className={styles.subtitle}>
            Apply for a program and track every stage of your admission.
          </p>
        </div>
        <div className={styles.headerIcon}>
          <GraduationCap size={25} />
        </div>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>Start your application</p>
              <h2>Apply for admission</h2>
            </div>
            <Plus size={20} />
          </div>
          <form className={styles.form} onSubmit={handleSubmit(submit)}>
            <label>
              Program
              <select
                {...register("programId")}
                disabled={programsQuery.isPending}
              >
                <option value="">Choose a program</option>
                {filteredPrograms.map((program: Program) => (
                  <option key={program.id} value={program.id}>
                    {program.department.name} · {program.degreeType}
                  </option>
                ))}
              </select>
              {errors.programId && (
                <span className={styles.fieldError}>
                  {errors.programId.message}
                </span>
              )}
            </label>
            <label>
              Admission year
              <input
                type="number"
                min="2000"
                max="2100"
                {...register("admissionYear")}
              />
              {errors.admissionYear && (
                <span className={styles.fieldError}>
                  {errors.admissionYear.message}
                </span>
              )}
            </label>
            {createMutation.error && (
              <p className={styles.error} role="alert">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Unable to submit application."}
              </p>
            )}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                programsQuery.isPending
              }
            >
              {createMutation.isPending
                ? "Submitting..."
                : "Submit application"}
            </button>
          </form>
        </section>

        <section className={styles.history}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>Application history</p>
              <h2>{admissions.length} applications</h2>
            </div>
            <FileText size={20} />
          </div>
          {requestError && (
            <p className={styles.error} role="alert">
              {requestError instanceof Error
                ? requestError.message
                : "Unable to load admissions."}
            </p>
          )}
          {admissionsQuery.isPending ? (
            <div className={styles.loading}>
              <LoaderCircle className={styles.spin} size={20} /> Loading
              applications...
            </div>
          ) : admissions.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={28} />
              <strong>No applications yet</strong>
              <span>Your submitted applications will appear here.</span>
            </div>
          ) : (
            <div className={styles.cards}>
              {admissions.map((admission) => (
                <AdmissionCard key={admission.id} admission={admission} />
              ))}
            </div>
          )}
        </section>
      </div>
      <div className={styles.note}>
        <ShieldAlert size={17} />
        <span>
          Applications require email verification and an active admission
          period. Approved applications can be paid through bKash.
        </span>
      </div>
    </main>
  );
}

function AdmissionCard({ admission }: { admission: StudentAdmission }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span
          className={`${styles.status} ${styles[admission.status.toLowerCase()]}`}
        >
          {statusLabels[admission.status]}
        </span>
        <span>{admission.admissionYear}</span>
      </div>
      <h3>{admission.program.department.name}</h3>
      <p>{admission.program.degreeType} program</p>
      <div className={styles.cardFooter}>
        <span>Application fee</span>
        <strong>
          ৳
          {Number(admission.admissionFee).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
          })}
        </strong>
      </div>
    </article>
  );
}
