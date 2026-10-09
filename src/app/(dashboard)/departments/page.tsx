"use client";

import {
  Building2,
  Edit3,
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
import { departmentsApi, type Department } from "@/lib/api";

const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must be at least 2 characters.")
    .max(100, "Department name cannot exceed 100 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Department code must be at least 2 characters.")
    .max(10, "Department code cannot exceed 10 characters.")
    .transform((value) => value.toUpperCase()),
});

type DepartmentValues = z.input<typeof departmentSchema>;

export default function DepartmentsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN"]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    department?: Department;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadDepartments() {
    setLoading(true);
    setError("");
    try {
      setDepartments(await departmentsApi.list());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load departments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void loadDepartments(), 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  async function deleteDepartment(department: Department) {
    if (
      !window.confirm(
        `Delete ${department.name}? This is only possible when it has no related records.`,
      )
    )
      return;
    setDeletingId(department.id);
    setError("");
    try {
      await departmentsApi.remove(department.id);
      await loadDepartments();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this department.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (checkingAccess || !user)
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <Building2 size={22} />
        </div>
        <p>Checking administrator access...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Administration / Structure</p>
          <h1>Departments</h1>
          <p className="subtitle">
            Keep the university structure organized for programs, courses, and
            faculty.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setModal({ mode: "create" })}
        >
          <Plus size={17} /> New department
        </button>
      </header>
      <div className="department-summary">
        <div>
          <strong>{departments.length}</strong>
          <span>departments</span>
        </div>
        <p>
          Department codes are used across academic records and must remain
          unique.
        </p>
      </div>
      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}
      {loading ? (
        <div className="department-state">
          <LoaderCircle className="spin" size={22} />
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <div className="department-state">
          <Building2 size={25} />
          <strong>No departments yet</strong>
          <span>
            Create the first department to start building your academic
            structure.
          </span>
        </div>
      ) : (
        <section className="department-grid">
          {departments.map((department) => (
            <article className="department-card" key={department.id}>
              <div className="department-card-top">
                <div className="department-symbol">
                  <Building2 size={19} />
                </div>
                <span className="code-pill">{department.code}</span>
              </div>
              <h2>{department.name}</h2>
              <p>Academic department</p>
              <div className="department-card-actions">
                <button onClick={() => setModal({ mode: "edit", department })}>
                  <Edit3 size={15} /> Edit
                </button>
                <button
                  className="danger-button"
                  disabled={deletingId === department.id}
                  onClick={() => deleteDepartment(department)}
                >
                  {deletingId === department.id ? (
                    <LoaderCircle className="spin" size={15} />
                  ) : (
                    <Trash2 size={15} />
                  )}{" "}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {modal && (
        <DepartmentModal
          mode={modal.mode}
          department={modal.department}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadDepartments();
          }}
        />
      )}
    </main>
  );
}

function DepartmentModal({
  mode,
  department,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  department?: Department;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? "",
      code: department?.code ?? "",
    },
  });

  async function saveDepartment(values: DepartmentValues) {
    setError("");
    try {
      if (mode === "create") await departmentsApi.create(values);
      else if (department) await departmentsApi.update(department.id, values);
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this department.",
      );
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">University structure</p>
            <h2>
              {mode === "create" ? "Create department" : "Edit department"}
            </h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit(saveDepartment)}>
          <label>
            Department name
            <input
              {...register("name")}
              placeholder="Computer Science and Engineering"
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </label>
          <label>
            Department code
            <input
              {...register("code")}
              style={{ textTransform: "uppercase" }}
              placeholder="CSE"
            />
            {errors.code && (
              <span className="field-error">{errors.code.message}</span>
            )}
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create department"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
