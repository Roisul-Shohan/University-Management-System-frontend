"use client";

import { BookOpen, Edit3, GraduationCap, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, coursesApi, curriculumCoursesApi, programsApi, type Course, type CurriculumCourse, type Program, type User } from "@/lib/api";
import styles from "./curriculum.module.css";

export default function CurriculumCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<CurriculumCourse[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programId, setProgramId] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [modal, setModal] = useState<CurriculumCourse | "create" | null>(null);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "TEACHER";

  async function loadCurriculum(filter: { programId?: string; year?: number; semester?: number } = {}) {
    setLoading(true); setError("");
    try { setItems(await curriculumCoursesApi.list(filter)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load curriculum courses."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    authApi.me().then(async (currentUser) => {
      setUser(currentUser);
      const [curriculumResult, programResult] = await Promise.all([curriculumCoursesApi.list(), programsApi.list()]);
      setItems(curriculumResult); setPrograms(programResult); setLoading(false);
    }).catch(() => router.replace("/login"));
  }, [router]);

  async function applyFilters(nextProgram = programId, nextYear = year, nextSemester = semester) {
    await loadCurriculum({ programId: nextProgram || undefined, year: nextYear ? Number(nextYear) : undefined, semester: nextSemester ? Number(nextSemester) : undefined });
  }

  async function deleteItem(item: CurriculumCourse) {
    if (!window.confirm(`Remove ${item.course.code} from ${item.program.degreeType}?`)) return;
    try { await curriculumCoursesApi.remove(item.id); await applyFilters(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to remove this curriculum course."); }
  }

  if (!user || loading && items.length === 0) return <main className="loading-screen"><div className="loading-mark"><GraduationCap size={22} /></div><p>Loading curriculum...</p></main>;

  return <main className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">Academics / Curriculum</p><h1>Curriculum courses</h1><p className="subtitle">Map every course to the program term where students should take it.</p></div>{canManage && <button className="primary-button" onClick={() => setModal("create")}><Plus size={17} /> Assign course</button>}</header><div className={styles.filters}><div><label>Program<select value={programId} onChange={(event) => { setProgramId(event.target.value); void applyFilters(event.target.value, year, semester); }}><option value="">All programs</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.department.code} · {program.degreeType}</option>)}</select></label><label>Year<select value={year} onChange={(event) => { setYear(event.target.value); void applyFilters(programId, event.target.value, semester); }}><option value="">All years</option>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>Year {value}</option>)}</select></label><label>Semester<select value={semester} onChange={(event) => { setSemester(event.target.value); void applyFilters(programId, year, event.target.value); }}><option value="">All semesters</option>{[1, 2].map((value) => <option key={value} value={value}>Semester {value}</option>)}</select></label></div><span className={styles.count}>{items.length} assignments</span></div>{error && <div className="inline-error"><ShieldAlert size={16} />{error}</div>}<section className={styles.table}><div className={styles.head}><span>Course</span><span>Program</span><span>Term</span><span>Actions</span></div>{items.map((item) => <article className={styles.row} key={item.id}><div className={styles.course}><div className={styles.icon}><BookOpen size={17} /></div><div><strong>{item.course.code}</strong><span>{item.course.name}</span></div></div><div className={styles.program}><strong>{item.program.degreeType}</strong><span>{item.program.department.code} · {item.program.department.name}</span></div><div className={styles.term}><strong>Year {item.year}</strong><span>Semester {item.semester}</span></div>{canManage && <div className={styles.actions}><button onClick={() => setModal(item)} aria-label="Edit assignment"><Edit3 size={15} /></button><button className={styles.danger} onClick={() => deleteItem(item)} aria-label="Remove assignment"><Trash2 size={15} /></button></div>}</article>)}</section>{items.length === 0 && !loading && <div className="department-state"><GraduationCap size={25} /><strong>No curriculum assignments</strong><span>Assign a course to a program term to begin.</span></div>}{modal && <CurriculumModal mode={modal === "create" ? "create" : "edit"} item={modal === "create" ? undefined : modal} programs={programs} onClose={() => setModal(null)} onSaved={() => { setModal(null); void applyFilters(); }} />}</main>;
}

function CurriculumModal({ mode, item, programs, onClose, onSaved }: { mode: "create" | "edit"; item?: CurriculumCourse; programs: Program[]; onClose: () => void; onSaved: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programId, setProgramId] = useState(item?.programId ?? programs[0]?.id ?? "");
  const [courseId, setCourseId] = useState(item?.courseId ?? "");
  const [year, setYear] = useState(String(item?.year ?? 1));
  const [semester, setSemester] = useState(String(item?.semester ?? 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { coursesApi.list().then(setCourses).catch(() => setError("Unable to load courses.")); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { const input = { programId, courseId, year: Number(year), semester: Number(semester) }; if (mode === "create") await curriculumCoursesApi.create(input); else if (item) await curriculumCoursesApi.update(item.id, input); onSaved(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save this assignment."); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="period-modal"><div className="modal-heading"><div><p className="eyebrow">Program curriculum</p><h2>{mode === "create" ? "Assign a course" : "Edit assignment"}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><form className="period-form" onSubmit={submit}><label>Program<select value={programId} onChange={(event) => setProgramId(event.target.value)} required>{programs.map((program) => <option key={program.id} value={program.id}>{program.department.code} · {program.degreeType}</option>)}</select></label><label>Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} required><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label><div className={styles.formGrid}><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></select></label><label>Semester<select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : mode === "create" ? "Assign course" : "Save changes"}</button></div></form></section></div>;
}
