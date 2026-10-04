"use client";

import {
  BookOpen,
  Edit3,
  GraduationCap,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  authApi,
  departmentsApi,
  degreeTypes,
  programsApi,
  type DegreeType,
  type Department,
  type Program,
  type User,
} from "@/lib/api";
import styles from "./programs.module.css";

const degreeLabels: Record<DegreeType, string> = {
  BSC: "Bachelor of Science",
  MSC: "Master of Science",
  PHD: "Doctor of Philosophy",
};

const programSchema = z.object({
  departmentId: z.string().uuid("Choose a valid department."),
  degreeType: z.enum(["BSC", "MSC", "PHD"]),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function ProgramsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Program | "create" | null>(null);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "TEACHER";

  async function loadPrograms(filter = departmentId) {
    setLoading(true);
    setError("");
    try {
      setPrograms(await programsApi.list(filter || undefined));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load programs.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authApi
      .me()
      .then(async (currentUser) => {
        setUser(currentUser);
        const [programResult, departmentResult] = await Promise.all([
          programsApi.list(),
          departmentsApi.list(),
        ]);
        setPrograms(programResult);
        setDepartments(departmentResult);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function deleteProgram(program: Program) {
    if (
      !window.confirm(`Delete the ${degreeLabels[program.degreeType]} program?`)
    )
      return;
    setError("");
    try {
      await programsApi.remove(program.id);
      await loadPrograms();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this program.",
      );
    }
  }

  if (!user || (loading && programs.length === 0))
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <GraduationCap size={22} />
        </div>
        <p>Loading academic programs...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Programs</p>
          <h1>Programs</h1>
          <p className="subtitle">
            Define the degree paths that organize your university curriculum.
          </p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => setModal("create")}>
            <Plus size={17} /> New program
          </button>
        )}
      </header>
      <div className={styles.toolbar}>
        <div className={styles.count}>
          <GraduationCap size={18} />
          <span>{programs.length} programs</span>
        </div>
        <select
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(event.target.value);
            void loadPrograms(event.target.value);
          }}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}
      <section className={styles.grid}>
        {programs.map((program) => (
          <article className={styles.card} key={program.id}>
            <div className={styles.top}>
              <div className={styles.icon}>
                <BookOpen size={19} />
              </div>
              <span className={styles.badge}>{program.degreeType}</span>
            </div>
            <h2>{degreeLabels[program.degreeType]}</h2>
            <p>
              {program.department.name} <span>·</span> {program.department.code}
            </p>
            <div className={styles.footer}>
              {program._count ? (
                <span>{program._count.students} students</span>
              ) : (
                <span>Degree program</span>
              )}
              {canManage && (
                <div>
                  <button onClick={() => setModal(program)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className={styles.danger}
                    onClick={() => deleteProgram(program)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
      {programs.length === 0 && (
        <div className="department-state">
          <GraduationCap size={25} />
          <strong>No programs found</strong>
          <span>Create a program or change the department filter.</span>
        </div>
      )}
      {modal && (
        <ProgramModal
          mode={modal === "create" ? "create" : "edit"}
          program={modal === "create" ? undefined : modal}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadPrograms();
          }}
        />
      )}
    </main>
  );
}

function ProgramModal({
  mode,
  program,
  departments,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  program?: Program;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      departmentId: program?.departmentId ?? departments[0]?.id ?? "",
      degreeType: program?.degreeType ?? "BSC",
    },
  });

  async function submit(values: ProgramFormValues) {
    setError("");
    try {
      if (mode === "create")
        await programsApi.create(values);
      else if (program)
        await programsApi.update(program.id, { degreeType: values.degreeType });
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this program.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Academic structure</p>
            <h2>{mode === "create" ? "Create program" : "Edit program"}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit(submit)}>
          {mode === "create" && (
            <label>
              Department
              <select
                {...register("departmentId")}
              >
                <option value="">Choose a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <span className="field-error">{errors.departmentId.message}</span>
              )}
            </label>
          )}
          <label>
            Degree type
            <select {...register("degreeType")}>
              {degreeTypes.map((type) => (
                <option key={type} value={type}>
                  {degreeLabels[type]}
                </option>
              ))}
            </select>
            {errors.degreeType && (
              <span className="field-error">{errors.degreeType.message}</span>
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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create program"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
