"use client";

import {
  CalendarDays,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthGuard } from "../../auth-provider";
import { academicPeriodsApi, type AcademicPeriod } from "@/lib/academic-periods-api";
import styles from "./academic-periods.module.css";

const periodSchema = z.object({
  type: z.enum(["ADMISSION", "SEMESTER_REGISTRATION", "COURSE_REGISTRATION", "MIDTERM_EXAM", "FINAL_EXAM", "RESULT_PUBLICATION"]),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  status: z.enum(["ACTIVE", "UPCOMING", "COMPLETED"]),
}).refine(
  (values) => new Date(values.startDate) < new Date(values.endDate),
  { message: "Start date must be before end date.", path: ["endDate"] }
);

type PeriodValues = z.infer<typeof periodSchema>;

function formatType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function AcademicPeriodsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN"]);
  const [items, setItems] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<AcademicPeriod | "create" | null>(null);

  async function loadPeriods() {
    setLoading(true);
    setError("");
    try {
      setItems(await academicPeriodsApi.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load academic periods.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void loadPeriods();
  }, [user]);

  const form = useForm<PeriodValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: { type: "ADMISSION", startDate: "", endDate: "", status: "UPCOMING" },
  });

  useEffect(() => {
    if (modal && typeof modal === "object") {
      const period = modal as AcademicPeriod;
      form.reset({
        type: period.type as PeriodValues["type"],
        startDate: period.startDate.split("T")[0],
        endDate: period.endDate.split("T")[0],
        status: period.status,
      });
    } else {
      form.reset({ type: "ADMISSION", startDate: "", endDate: "", status: "UPCOMING" });
    }
  }, [modal]);

  async function submit(values: PeriodValues) {
    setError("");
    try {
      if (modal === "create") {
        await academicPeriodsApi.create(values);
      } else if (modal && "id" in modal) {
        await academicPeriodsApi.update(modal.id, values);
      }
      setModal(null);
      form.reset();
      await loadPeriods();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save academic period.",
      );
    }
  }

  async function deletePeriod(id: string) {
    if (!window.confirm("Delete this academic period?")) return;
    try {
      await academicPeriodsApi.remove(id);
      await loadPeriods();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete academic period.",
      );
    }
  }

  if (checkingAccess || !user || (loading && items.length === 0))
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <CalendarDays size={22} />
        </div>
        <p>Loading academic periods...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Periods</p>
          <h1>Academic periods</h1>
          <p className="subtitle">Define academic years, semesters, and their active windows.</p>
        </div>
        <button className="primary-button" onClick={() => { form.reset(); setModal("create"); }}>
          <Plus size={17} /> Add period
        </button>
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
      ) : items.length === 0 ? (
        <div className="department-state">
          <CalendarDays size={25} />
          <strong>No academic periods</strong>
          <span>Create your first academic period to get started.</span>
        </div>
      ) : (
        <section className={styles.table}>
          <div className={styles.head}>
            <span>Name</span>
            <span>Period</span>
            <span>Status</span>
            <span />
          </div>
          {items.map((item) => (
            <article className={styles.row} key={item.id}>
              <div>
                <strong>{formatType(item.type)}</strong>
              </div>
              <div>{new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</div>
              <span className={`status-pill ${(item.status || "upcoming").toLowerCase()}`}>{item.status || "Upcoming"}</span>
              <div className={styles.actions}>
                <button onClick={() => setModal(item)} aria-label="Edit period">
                  Edit
                </button>
                <button className={styles.danger} onClick={() => deletePeriod(item.id)} aria-label="Delete period">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {modal && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Academic period</p>
                <h2>{modal === "create" ? "Add academic period" : "Edit academic period"}</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="period-form" onSubmit={form.handleSubmit(submit)}>
              <label>
                Type
                <select {...form.register("type")}>
                  <option value="ADMISSION">Admission</option>
                  <option value="SEMESTER_REGISTRATION">Semester Registration</option>
                  <option value="COURSE_REGISTRATION">Course Registration</option>
                  <option value="MIDTERM_EXAM">Midterm Exam</option>
                  <option value="FINAL_EXAM">Final Exam</option>
                  <option value="RESULT_PUBLICATION">Result Publication</option>
                </select>
                {form.formState.errors.type && (
                  <span className="field-error">{form.formState.errors.type.message}</span>
                )}
              </label>
              <div className={styles.formGrid}>
                <label>
                  Start date
                  <input type="date" {...form.register("startDate")} />
                  {form.formState.errors.startDate && (
                    <span className="field-error">{form.formState.errors.startDate.message}</span>
                  )}
                </label>
                <label>
                  End date
                  <input type="date" {...form.register("endDate")} />
                  {form.formState.errors.endDate && (
                    <span className="field-error">{form.formState.errors.endDate.message}</span>
                  )}
                </label>
              </div>
              <label>
                Status
                <select {...form.register("status")}>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : modal === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}