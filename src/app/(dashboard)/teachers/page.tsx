"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserCheck,
  UserPlus,
  ShieldAlert,
  LoaderCircle,
  X,
  Check,
  XCircle,
} from "lucide-react";
import { useAuthGuard } from "../../auth-provider";
import { teachersApi, type Teacher, type TeacherApplication } from "@/lib/teachers-api";
import { departmentsApi, type Department } from "@/lib/api";
import styles from "./teachers.module.css";

const applySchema = z.object({
  departmentId: z.string().min(1, "Choose a department."),
  joiningYear: z.coerce.number().int().min(2000).max(3000).optional(),
});

type ApplyValues = z.infer<typeof applySchema>;

type ModalMode = "apply" | "approve" | "reject" | null;

export default function TeachersPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN", "TEACHER"]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentTeacherProfile, setCurrentTeacherProfile] = useState<Teacher | null>(null);

  const isTeacher = user?.role === "TEACHER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isDeptAdmin = currentTeacherProfile?.isDeptAdmin === true;
  const currentUserDeptId = currentTeacherProfile?.departmentId;

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      if (isSuperAdmin) {
        const data = await teachersApi.list();
        setTeachers(data);
      }
      if (isTeacher) {
        try {
          const [teacherData, appData] = await Promise.all([
            teachersApi.me(),
            teachersApi.myApplication(),
          ]);
          setCurrentTeacherProfile(teacherData);
          setTeachers([teacherData]);
          setApplications([appData]);
        } catch {
          // Teacher doesn't have a profile yet (application pending or rejected)
          setTeachers([]);
          const appData = await teachersApi.myApplication().catch(() => null);
          if (appData) setApplications([appData]);
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load teachers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([departmentsApi.list()])
      .then(([deptResult]) => setDepartments(deptResult))
      .catch(() => {});
    void loadTeachers();
  }, [user]);

  const applyForm = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { departmentId: "", joiningYear: undefined },
  });

  async function submitApply(values: ApplyValues) {
    setError("");
    try {
      await teachersApi.apply(values);
      setModal(null);
      applyForm.reset();
      void loadTeachers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit application.",
      );
    }
  }

  async function approveApplication(id: string) {
    setActionLoading(id);
    setError("");
    try {
      await teachersApi.approveApplication(id);
      setModal(null);
      setSelectedApplication(null);
      void loadTeachers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve application.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectApplication(id: string, reason?: string) {
    setActionLoading(id);
    setError("");
    try {
      await teachersApi.rejectApplication(id, reason);
      setModal(null);
      setSelectedApplication(null);
      void loadTeachers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reject application.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleAdminStatus(teacher: Teacher) {
    setActionLoading(teacher.id);
    setError("");
    try {
      await teachersApi.updateAdminStatus(teacher.id, {
        isDeptAdmin: !teacher.isDeptAdmin,
      });
      void loadTeachers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update status.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleTeacherStatus(teacher: Teacher) {
    const newStatus = teacher.user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setActionLoading(teacher.id);
    setError("");
    try {
      await teachersApi.updateStatus(teacher.id, { status: newStatus });
      void loadTeachers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update status.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking access...</main>;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">People / Faculty</p>
          <h1>Teachers</h1>
          <p className="subtitle">
            Manage faculty applications and department administration.
          </p>
        </div>
        {isTeacher && !currentTeacherProfile && (
          <button className="primary-button" onClick={() => setModal("apply")}>
            <UserPlus size={17} /> Apply as teacher
          </button>
        )}
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
        <section className={styles.list}>
          {isSuperAdmin && (
            <div className={styles.section}>
              <h2>Faculty directory</h2>
              {teachers.length === 0 ? (
                <div className="department-state">
                  <UserCheck size={25} />
                  <strong>No teachers found</strong>
                </div>
              ) : (
                <div className={styles.table}>
                  {teachers.map((teacher) => (
                    <div className={styles.row} key={teacher.id}>
                      <div>
                        <strong>{teacher.user.name}</strong>
                        <span>{teacher.user.email}</span>
                      </div>
                      <div>
                        {teacher.department?.code ?? "—"} ·{" "}
                        {teacher.department?.name ?? "—"}
                      </div>
                      <span
                        className={`status-pill ${
                          teacher.user.status === "ACTIVE" ? "active" : "inactive"
                        }`}
                      >
                        {teacher.user.status}
                      </span>
                      {isSuperAdmin && (
                        <button
                          className={styles.adminToggle}
                          disabled={actionLoading === teacher.id}
                          onClick={() => toggleAdminStatus(teacher)}
                        >
                          {teacher.isDeptAdmin ? "Remove admin" : "Make admin"}
                        </button>
                      )}
                      {isTeacher &&
                      teacher.departmentId === currentUserDeptId &&
                      isDeptAdmin && (
                        <button
                          className={styles.statusToggle}
                          disabled={actionLoading === teacher.id}
                          onClick={() => toggleTeacherStatus(teacher)}
                        >
                          {teacher.user.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isTeacher || isSuperAdmin) && (
            <div className={styles.section}>
              <h2>Applications</h2>
              {applications.length === 0 ? (
                <div className="department-state">
                  <UserCheck size={25} />
                  <strong>No applications</strong>
                </div>
              ) : (
                <div className={styles.table}>
                  {applications.map((app) => (
                    <div className={styles.row} key={app.id}>
                      <div>
                        <strong>{app.user.name}</strong>
                        <span>{app.user.email}</span>
                      </div>
                      <div>
                        {app.department?.code ?? "—"} ·{" "}
                        {app.department?.name ?? "—"}
                      </div>
                      <span
                        className={`status-pill ${
                          app.status === "APPROVED"
                            ? "active"
                            : app.status === "REJECTED"
                              ? "inactive"
                              : "pending"
                        }`}
                      >
                        {app.status}
                      </span>
                      {isSuperAdmin && app.status === "PENDING" && (
                        <div className={styles.actions}>
                          <button
                            className={styles.approve}
                            disabled={actionLoading === app.id}
                            onClick={() => {
                              setSelectedApplication(app);
                              setModal("approve");
                            }}
                          >
                            <Check size={15} /> Approve
                          </button>
                          <button
                            className={styles.reject}
                            disabled={actionLoading === app.id}
                            onClick={() => {
                              setSelectedApplication(app);
                              setModal("reject");
                            }}
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {modal === "apply" && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Faculty</p>
                <h2>Apply as teacher</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="period-form" onSubmit={applyForm.handleSubmit(submitApply)}>
              <label>
                Department
                <select {...applyForm.register("departmentId")}>
                  <option value="">Choose a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {applyForm.formState.errors.departmentId && (
                  <span className="field-error">
                    {applyForm.formState.errors.departmentId.message}
                  </span>
                )}
              </label>
              <label>
                Joining year
                <input
                  type="number"
                  {...applyForm.register("joiningYear")}
                  placeholder="2024"
                />
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
                  disabled={applyForm.formState.isSubmitting}
                >
                  {applyForm.formState.isSubmitting ? "Submitting..." : "Apply"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modal === "approve" && selectedApplication && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Applications</p>
                <h2>Approve application</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p>
              Approve {selectedApplication.user.name}&apos;s application for{" "}
              {selectedApplication.department.name}?
            </p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={actionLoading === selectedApplication.id}
                onClick={() => approveApplication(selectedApplication.id)}
              >
                {actionLoading === selectedApplication.id ? "Approving..." : "Approve"}
              </button>
            </div>
          </section>
        </div>
      )}

      {modal === "reject" && selectedApplication && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Applications</p>
                <h2>Reject application</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p>
              Reject {selectedApplication.user.name}&apos;s application for{" "}
              {selectedApplication.department.name}?
            </p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className={styles.rejectButton}
                disabled={actionLoading === selectedApplication.id}
                onClick={() => rejectApplication(selectedApplication.id)}
              >
                {actionLoading === selectedApplication.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
