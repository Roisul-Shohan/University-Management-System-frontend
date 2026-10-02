"use client";

import { BookOpen, Edit3, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, coursesApi, departmentsApi, type Course, type Department, type User } from "@/lib/api";
import styles from "./courses.module.css";

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Course | "create" | null>(null);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "TEACHER";

  async function loadCourses(filter = departmentId) {
    setLoading(true); setError("");
    try { setCourses(await coursesApi.list(filter || undefined)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load courses."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    authApi.me().then(async (currentUser) => {
      setUser(currentUser);
      const [courseResult, departmentResult] = await Promise.all([coursesApi.list(), departmentsApi.list()]);
      setCourses(courseResult); setDepartments(departmentResult); setLoading(false);
    }).catch(() => router.replace("/login"));
  }, [router]);

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete ${course.code} · ${course.name}?`)) return;
    setError("");
    try { await coursesApi.remove(course.id); await loadCourses(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to delete this course."); }
  }

  if (!user || loading && courses.length === 0) return <main className="loading-screen"><div className="loading-mark"><BookOpen size={22} /></div><p>Loading courses...</p></main>;

  return <main className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Academics / Catalog</p><h1>Courses</h1><p className="subtitle">Manage the course catalog that powers programs, offerings, and enrollment.</p></div>{canManage && <button className="primary-button" onClick={() => setModal("create")}><Plus size={17} /> New course</button>}</header><div className={styles.toolbar}><div className={styles.count}><BookOpen size={18} /><span>{courses.length} courses</span></div><select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); void loadCourses(event.target.value); }}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>{error && <div className="inline-error"><ShieldAlert size={16} />{error}</div>}<section className={styles.table}>{courses.map((course) => <article className={styles.row} key={course.id}><div className={styles.courseIcon}><BookOpen size={18} /></div><div className={styles.courseMain}><strong>{course.code}</strong><span>{course.name}</span></div><div className={styles.department}>{course.department.code}<small>{course.department.name}</small></div><div className={styles.credits}><strong>{course.credits}</strong><span>credits</span></div>{canManage && <div className={styles.actions}><button onClick={() => setModal(course)} aria-label={`Edit ${course.code}`}><Edit3 size={15} /></button><button className={styles.danger} onClick={() => deleteCourse(course)} aria-label={`Delete ${course.code}`}><Trash2 size={15} /></button></div>}</article>)}</section>{courses.length === 0 && !loading && <div className="department-state"><BookOpen size={25} /><strong>No courses found</strong><span>Create a course or change the department filter.</span></div>}{modal && <CourseModal mode={modal === "create" ? "create" : "edit"} course={modal === "create" ? undefined : modal} departments={departments} onClose={() => setModal(null)} onSaved={() => { setModal(null); void loadCourses(); }} />}</main>;
}

function CourseModal({ mode, course, departments, onClose, onSaved }: { mode: "create" | "edit"; course?: Course; departments: Department[]; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(course?.code ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [credits, setCredits] = useState(String(course?.credits ?? ""));
  const [departmentId, setDepartmentId] = useState(course?.departmentId ?? departments[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { if (mode === "create") await coursesApi.create({ code: code.trim(), name: name.trim(), credits: Number(credits), departmentId }); else if (course) await coursesApi.update(course.id, { code: code.trim(), name: name.trim(), credits: Number(credits) }); onSaved(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save this course."); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="period-modal"><div className="modal-heading"><div><p className="eyebrow">Course catalog</p><h2>{mode === "create" ? "Create course" : "Edit course"}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form className="period-form" onSubmit={submit}><div className={styles.formGrid}><label>Course code<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="CSE 201" minLength={2} maxLength={30} required /></label><label>Credits<input type="number" value={credits} onChange={(event) => setCredits(event.target.value)} min="0.5" step="0.5" required /></label></div><label>Course name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Data Structures and Algorithms" minLength={2} maxLength={150} required /></label>{mode === "create" && <label>Department<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required><option value="">Choose a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label>}{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create course" : "Save changes"}</button></div></form></section></div>;
}
