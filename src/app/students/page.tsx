"use client";

import { GraduationCap, Search, ShieldAlert, UserCheck, UserX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, departmentsApi, programsApi, type Department, type Program, type User } from "@/lib/api";
import { studentsApi, type Student } from "@/lib/student-api";
import styles from "./students.module.css";

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  async function loadStudents() {
    setLoading(true); setError("");
    try { setStudents(await studentsApi.list({ departmentId: departmentId || undefined, programId: programId || undefined, admissionYear: admissionYear ? Number(admissionYear) : undefined, isActive: status === "" ? undefined : status === "active" })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load students."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    authApi.me().then(async (currentUser) => {
      if (currentUser.role !== "SUPER_ADMIN") { router.replace("/"); return; }
      setUser(currentUser);
      const [studentResult, departmentResult, programResult] = await Promise.all([studentsApi.list(), departmentsApi.list(), programsApi.list()]);
      setStudents(studentResult); setDepartments(departmentResult); setPrograms(programResult); setLoading(false);
    }).catch(() => router.replace("/login"));
  }, [router]);

  const visibleStudents = students.filter((student) => student.studentId.toLowerCase().includes(search.toLowerCase()) || student.program.department.name.toLowerCase().includes(search.toLowerCase()) || student.program.degreeType.toLowerCase().includes(search.toLowerCase()));
  const activeCount = students.filter((student) => student.isActive).length;

  if (!user || loading && students.length === 0) return <main className="loading-screen"><div className="loading-mark"><GraduationCap size={22} /></div><p>Loading student directory...</p></main>;

  return <main className="admin-page"><header className="admin-page-header"><div><p className="eyebrow">People / Students</p><h1>Student directory</h1><p className="subtitle">Review enrollment status, academic progress, and program membership.</p></div><div className={styles.summary}><strong>{activeCount}</strong><span>active students</span></div></header><div className={styles.toolbar}><div className={styles.search}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student ID or program" /></div><div className={styles.filters}><select value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setProgramId(""); }}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><select value={programId} onChange={(event) => setProgramId(event.target.value)}><option value="">All programs</option>{programs.filter((program) => !departmentId || program.departmentId === departmentId).map((program) => <option key={program.id} value={program.id}>{program.department.code} · {program.degreeType}</option>)}</select><select value={admissionYear} onChange={(event) => setAdmissionYear(event.target.value)}><option value="">All admission years</option>{[2026, 2025, 2024, 2023, 2022].map((year) => <option key={year} value={year}>{year}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button className="primary-button" onClick={() => void loadStudents()}>Apply filters</button></div></div>{error && <div className="inline-error"><ShieldAlert size={16} />{error}</div>}<section className={styles.table}><div className={styles.head}><span>Student</span><span>Program</span><span>Progress</span><span>Status</span><span /></div>{visibleStudents.map((student) => <button className={styles.row} key={student.id} onClick={() => setSelected(student)}><div className={styles.identity}><div className={styles.avatar}>{student.studentId.slice(-2)}</div><div><strong>{student.studentId}</strong><span>Admitted {student.admissionYear}</span></div></div><div className={styles.program}><strong>{student.program.degreeType}</strong><span>{student.program.department.code} · {student.program.department.name}</span></div><div className={styles.progress}><strong>Year {student.currentYear}</strong><span>Semester {student.currentSemester}</span></div><span className={`${styles.status} ${student.isActive ? styles.active : styles.inactive}`}><i />{student.isActive ? "Active" : "Inactive"}</span><span className={styles.arrow}>›</span></button>)}</section>{visibleStudents.length === 0 && !loading && <div className="department-state"><GraduationCap size={25} /><strong>No students found</strong><span>Adjust your filters and try again.</span></div>}{selected && <StudentDrawer student={selected} onClose={() => setSelected(null)} />}</main>;
}

function StudentDrawer({ student, onClose }: { student: Student; onClose: () => void }) {
  return <div className="modal-backdrop"><aside className={styles.drawer}><div className={styles.drawerHeader}><div><p className="eyebrow">Student profile</p><h2>{student.studentId}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className={styles.profileHero}><div className={styles.largeAvatar}>{student.studentId.slice(-2)}</div><div><strong>{student.program.degreeType} candidate</strong><span>{student.program.department.name}</span></div></div><div className={styles.detailList}><div><span>Admission year</span><strong>{student.admissionYear}</strong></div><div><span>Program status</span><strong>{student.programStatus}</strong></div><div><span>Current year</span><strong>Year {student.currentYear}</strong></div><div><span>Current semester</span><strong>Semester {student.currentSemester}</strong></div></div><div className={styles.drawerStatus}>{student.isActive ? <UserCheck size={17} /> : <UserX size={17} />}<span>{student.isActive ? "This student is currently active." : "This student is currently inactive."}</span></div></aside></div>;
}
