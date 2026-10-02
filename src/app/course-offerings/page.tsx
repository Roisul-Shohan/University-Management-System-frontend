"use client";

import { BookOpen, Edit3, Plus, ShieldAlert, Trash2, Users, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, coursesApi, type Course, type User } from "@/lib/api";
import { courseOfferingsApi, teachersApi, type CourseOffering, type CourseOfferingInput, type OfferingTeacher } from "@/lib/course-offerings-api";
import styles from "./offerings.module.css";

export default function CourseOfferingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [modal, setModal] = useState<CourseOffering | "create" | null>(null);

  async function loadOfferings(nextYear = year, nextSemester = semester) {
    setLoading(true); setError("");
    try { setOfferings(await courseOfferingsApi.list({ year: nextYear ? Number(nextYear) : undefined, semester: nextSemester ? Number(nextSemester) : undefined })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load course offerings."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    authApi.me().then(async (currentUser) => {
      if (currentUser.role !== "SUPER_ADMIN") { router.replace("/"); return; }
      setUser(currentUser);
      setOfferings(await courseOfferingsApi.list());
      setLoading(false);
    }).catch(() => router.replace("/login"));
  }, [router]);

  async function deleteOffering(offering: CourseOffering) {
    if (!window.confirm(`Delete the ${offering.course.code} offering?`)) return;
    try { await courseOfferingsApi.remove(offering.id); await loadOfferings(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to delete this offering."); }
  }

  if (!user || loading && offerings.length === 0) return <main className="loading-screen"><div className="loading-mark"><BookOpen size={22} /></div><p>Loading course offerings...</p></main>;

  return <main className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Academics / Delivery</p><h1>Course offerings</h1><p className="subtitle">Assign instructors and capacity to courses for each academic term.</p></div><button className="primary-button" onClick={() => setModal("create")}><Plus size={17} /> New offering</button></header><div className={styles.filters}><div><label>Year<select value={year} onChange={(event) => { setYear(event.target.value); void loadOfferings(event.target.value, semester); }}><option value="">All years</option>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>Year {value}</option>)}</select></label><label>Semester<select value={semester} onChange={(event) => { setSemester(event.target.value); void loadOfferings(year, event.target.value); }}><option value="">All semesters</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label></div><span>{offerings.length} offerings</span></div>{error && <div className="inline-error"><ShieldAlert size={16} />{error}</div>}<section className={styles.table}><div className={styles.head}><span>Course</span><span>Instructor</span><span>Term</span><span>Capacity</span><span>Actions</span></div>{offerings.map((offering) => <article className={styles.row} key={offering.id}><div className={styles.course}><div className={styles.icon}><BookOpen size={17} /></div><div><strong>{offering.course.code}</strong><span>{offering.course.name}</span></div></div><div className={styles.teacher}><strong>{offering.teacher.user.name}</strong><span>{offering.teacher.department.code} · {offering.teacher.user.email}</span></div><div className={styles.term}><strong>Year {offering.year}</strong><span>Semester {offering.semester}</span></div><div className={styles.capacity}><strong>{offering._count?.enrollments ?? 0}{offering.capacity ? ` / ${offering.capacity}` : ""}</strong><span>enrolled</span></div><div className={styles.actions}><button onClick={() => setModal(offering)} aria-label="Edit offering"><Edit3 size={15} /></button><button className={styles.danger} onClick={() => deleteOffering(offering)} aria-label="Delete offering"><Trash2 size={15} /></button></div></article>)}</section>{offerings.length === 0 && !loading && <div className="department-state"><Users size={25} /><strong>No course offerings found</strong><span>Create an offering to assign an instructor to a course term.</span></div>}{modal && <OfferingModal mode={modal === "create" ? "create" : "edit"} offering={modal === "create" ? undefined : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); void loadOfferings(); }} />}</main>;
}

function OfferingModal({ mode, offering, onClose, onSaved }: { mode: "create" | "edit"; offering?: CourseOffering; onClose: () => void; onSaved: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<OfferingTeacher[]>([]);
  const [courseId, setCourseId] = useState(offering?.courseId ?? "");
  const [teacherId, setTeacherId] = useState(offering?.teacherId ?? "");
  const [year, setYear] = useState(String(offering?.year ?? 1));
  const [semester, setSemester] = useState(String(offering?.semester ?? 1));
  const [capacity, setCapacity] = useState(offering?.capacity ? String(offering.capacity) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([coursesApi.list(), teachersApi.list()]).then(([courseResult, teacherResult]) => { setCourses(courseResult); setTeachers(teacherResult); }).catch(() => setError("Unable to load courses and instructors.")); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { const input: CourseOfferingInput = { courseId, teacherId, year: Number(year), semester: Number(semester), capacity: capacity ? Number(capacity) : null }; if (mode === "create") await courseOfferingsApi.create(input); else if (offering) await courseOfferingsApi.update(offering.id, { teacherId, year: Number(year), semester: Number(semester), capacity: input.capacity }); onSaved(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save this offering."); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="period-modal"><div className="modal-heading"><div><p className="eyebrow">Course delivery</p><h2>{mode === "create" ? "Create offering" : "Edit offering"}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form className="period-form" onSubmit={submit}>{mode === "create" && <label>Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} required><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label>}<label>Instructor<select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} required><option value="">Choose an instructor</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user.name} · {teacher.department.code}</option>)}</select></label><div className={styles.formGrid}><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select></label><label>Semester<select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label></div><label>Capacity<input type="number" min="1" step="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="Unlimited" /></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Create offering" : "Save changes"}</button></div></form></section></div>;
}
