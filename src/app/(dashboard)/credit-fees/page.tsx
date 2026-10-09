"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldAlert, Trash2, X, LoaderCircle } from "lucide-react";
import { useAuthGuard } from "../../auth-provider";
import { creditFeesApi, type CreditFee } from "@/lib/credit-fees-api";
import { programsApi, type Program } from "@/lib/api";
import styles from "./credit-fees.module.css";

const schema = z.object({
  programId: z.string().min(1, "Choose a program."),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  isActive: z.boolean().optional(),
});

type Values = z.infer<typeof schema>;

export default function CreditFeesPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN"]);
  const [fees, setFees] = useState<CreditFee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<CreditFee | "create" | null>(null);

  async function loadFees() {
    setLoading(true);
    setError("");
    try {
      setFees(await creditFeesApi.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load credit fees.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([creditFeesApi.list(), programsApi.list()])
      .then(([feeResult, programResult]) => {
        setFees(feeResult);
        setPrograms(programResult);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load credit fees.",
        );
        setLoading(false);
      });
  }, [user]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { programId: "", amount: 0, isActive: true },
  });

  async function submit(values: Values) {
    setError("");
    try {
      if (modal === "create") await creditFeesApi.create(values);
      else if (modal) await creditFeesApi.update(modal.id, values);
      setModal(null);
      void loadFees();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save credit fee.",
      );
    }
  }

  async function deleteFee(id: string) {
    if (!window.confirm("Delete this credit fee?")) return;
    setError("");
    try {
      await creditFeesApi.remove(id);
      void loadFees();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete credit fee.",
      );
    }
  }

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking access...</main>;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Fees</p>
          <h1>Credit fees</h1>
          <p className="subtitle">Manage per-credit program fees.</p>
        </div>
        <button className="primary-button" onClick={() => setModal("create")}>
          <Plus size={17} /> New fee
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
      ) : (
        <section className={styles.table}>
          {fees.map((fee) => (
            <div className={styles.row} key={fee.id}>
              <div>
                <strong>
                  {fee.program
                    ? `${fee.program.department.code} · ${fee.program.degreeType}`
                    : fee.programId}
                </strong>
                <span>৳{Number(fee.amount).toLocaleString()} / credit</span>
              </div>
              <span
                className={`status-pill ${fee.isActive ? "active" : "inactive"}`}
              >
                {fee.isActive ? "Active" : "Inactive"}
              </span>
              <div className={styles.actions}>
                <button onClick={() => setModal(fee)}>Edit</button>
                <button className={styles.danger} onClick={() => deleteFee(fee.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {modal && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Academics / Fees</p>
                <h2>{modal === "create" ? "New credit fee" : "Edit credit fee"}</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="period-form" onSubmit={form.handleSubmit(submit)}>
              <label>
                Program
                <select {...form.register("programId")}>
                  <option value="">Choose a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.department.name} ({program.degreeType})
                    </option>
                  ))}
                </select>
                {form.formState.errors.programId && (
                  <span className="field-error">
                    {form.formState.errors.programId.message}
                  </span>
                )}
              </label>
              <label>
                Amount per credit
                <input type="number" {...form.register("amount")} />
                {form.formState.errors.amount && (
                  <span className="field-error">
                    {form.formState.errors.amount.message}
                  </span>
                )}
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" {...form.register("isActive")} />
                Active
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
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
