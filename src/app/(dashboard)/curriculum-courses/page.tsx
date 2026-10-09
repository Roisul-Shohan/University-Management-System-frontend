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
import { useAuthGuard } from "../../auth-provider";
import {
  coursesApi,
  curriculumCoursesApi,
  programsApi,
  type Course,
  type CurriculumCourse,
  type Program,
} from "@/lib/api";
import styles from "./curriculum.module.css";

const curriculumSchema = z.object({
  programId: z.string().min(1, "Choose a program."),
  courseId: z.string().min(1, "Choose a course."),
  year: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
      "Year must be at least 1.",
    ),
  semester: z
    .string()
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
      "Semester must be at least 1.",
    ),
});

type CurriculumValues = z.infer<typeof curriculumSchema>;

export default function CurriculumCoursesPage() {
  const { user, loading: checkingAccess } = useAuthGuard([
    "SUPER_ADMIN",
    "TEACHER",
  ]);
  const [items, setItems] = useState<CurriculumCourse[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programId, setProgramId] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [modal, setModal] = useState<CurriculumCourse | "create" | null>(null);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "TEACHER";
  const isDeptAdmin = user?.teacher?.isDeptAdmin === true;
  const teacherDeptId = user?.teacher?.departmentId;

  async function loadCurriculum(
    filter: { programId?: string; year?: number; semester?: number } = {},
  ) {
    setLoading(true);
    setError("");
    try {
      setItems(await curriculumCoursesApi.list(filter));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load curriculum courses.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      setCourses(await coursesApi.list(isDeptAdmin ? teacherDeptId : undefined));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load courses.",
      );
    }
  }

  useEffect(() => {
    if (!user) return;
    if (isDeptAdmin && !teacherDeptId) return; // Wait for teacher profile

    Promise.all([
      curriculumCoursesApi.list(),
      programsApi.list(isDeptAdmin ? teacherDeptId : undefined),
      coursesApi.list(isDeptAdmin ? teacherDeptId : undefined)
    ])
      .then(([curriculumResult, programResult, courseResult]) => {
        setItems(curriculumResult);
        setPrograms(programResult);
        setCourses(courseResult);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load curriculum courses.",
        );
        setLoading(false);
      });
  }, [user, teacherDeptId]);

  async function applyFilters(
    nextProgram = programId,
    nextYear = year,
    nextSemester = semester,
  ) {
    await loadCurriculum({
      programId: nextProgram || undefined,
      year: nextYear ? Number(nextYear) : undefined,
      semester: nextSemester ? Number(nextSemester) : undefined,
    });
  }

  async function deleteItem(item: CurriculumCourse) {
    if (
      !window.confirm(
        `Remove ${item.course.code} from ${item.program.degreeType}?`,
      )
    )
      return;
    try {
      await curriculumCoursesApi.remove(item.id);
      await applyFilters();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove this curriculum course.",
      );
    }
  }

  if (checkingAccess || !user || (loading && items.length === 0))
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <GraduationCap size={22} />
        </div>
        <p>Loading curriculum...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Curriculum</p>
          <h1>Curriculum courses</h1>
          <p className="subtitle">
            Map every course to the program term where students should take it.
          </p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => setModal("create")}>
            <Plus size={17} /> Assign course
          </button>
        )}
      </header>
      <div className={styles.filters}>
        <div>
          <label>
            Program
            <select
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                void applyFilters(event.target.value, year, semester);
              }}
            >
              <option value="">All programs</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.department.code} · {program.degreeType}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                void applyFilters(programId, event.target.value, semester);
              }}
            >
              <option value="">All years</option>
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  Year {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Semester
            <select
              value={semester}
              onChange={(event) => {
                setSemester(event.target.value);
                void applyFilters(programId, year, event.target.value);
              }}
            >
              <option value="">All semesters</option>
              {[1, 2].map((value) => (
                <option key={value} value={value}>
                  Semester {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className={styles.count}>{items.length} assignments</span>
      </div>
      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}
      <section className={styles.table}>
        <div className={styles.head}>
          <span>Course</span>
          <span>Program</span>
          <span>Term</span>
          <span>Actions</span>
        </div>
        {items.map((item) => (
          <article className={styles.row} key={item.id}>
            <div className={styles.course}>
              <div className={styles.icon}>
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{item.course.code}</strong>
                <span>{item.course.name}</span>
              </div>
            </div>
            <div className={styles.program}>
              <strong>{item.program.degreeType}</strong>
              <span>
                {item.program.department.code} · {item.program.department.name}
              </span>
            </div>
            <div className={styles.term}>
              <strong>Year {item.year}</strong>
              <span>Semester {item.semester}</span>
            </div>
            {canManage && (
              <div className={styles.actions}>
                <button
                  onClick={() => setModal(item)}
                  aria-label="Edit assignment"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className={styles.danger}
                  onClick={() => deleteItem(item)}
                  aria-label="Remove assignment"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      {items.length === 0 && !loading && (
        <div className="department-state">
          <GraduationCap size={25} />
          <strong>No curriculum assignments</strong>
          <span>Assign a course to a program term to begin.</span>
        </div>
      )}
      {modal && (
        <CurriculumModal
          mode={modal === "create" ? "create" : "edit"}
          item={modal === "create" ? undefined : modal}
          programs={programs}
          courses={courses}
          teacherDeptId={teacherDeptId}
          isDeptAdmin={isDeptAdmin}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void applyFilters();
          }}
        />
      )}
    </main>
  );
}

function CurriculumModal({
  mode,
  item,
  programs,
  courses,
  teacherDeptId,
  isDeptAdmin,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  item?: CurriculumCourse;
  programs: Program[];
  courses: Course[];
  teacherDeptId?: string;
  isDeptAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CurriculumValues>({
    resolver: zodResolver(curriculumSchema),
    defaultValues: {
      programId: item?.programId ?? programs[0]?.id ?? "",
      courseId: item?.courseId ?? "",
      year: String(item?.year ?? 1),
      semester: String(item?.semester ?? 1),
    },
  });
  const filteredCourses = isDeptAdmin && teacherDeptId
    ? courses.filter(c => c.departmentId === teacherDeptId)
    : courses;
  async function submit(values: CurriculumValues) {
    setError("");
    try {
      const input = {
        programId: values.programId,
        courseId: values.courseId,
        year: Number(values.year),
        semester: Number(values.semester),
      };
      if (mode === "create") await curriculumCoursesApi.create(input);
      else if (item) await curriculumCoursesApi.update(item.id, input);
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this assignment.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Program curriculum</p>
            <h2>{mode === "create" ? "Assign a course" : "Edit assignment"}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit(submit)}>
<label>
            Program
            <select {...register("programId")}>
              {(isDeptAdmin && teacherDeptId
                ? programs.filter(p => p.departmentId === teacherDeptId)
                : programs
              ).map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.department.code} · {program.degreeType}
                  </option>
                ))}
              </select>
              {errors.programId && (
                <span className="field-error">{errors.programId.message}</span>
              )}
            </label>
            <label>
            Course
            <select {...register("courseId")}>
              <option value="">Choose a course</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <span className="field-error">{errors.courseId.message}</span>
            )}
          </label>
          <div className={styles.formGrid}>
            <label>
              Year
              <select {...register("year")}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
              {errors.year && (
                <span className="field-error">{errors.year.message}</span>
              )}
            </label>
            <label>
              Semester
              <select {...register("semester")}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              {errors.semester && (
                <span className="field-error">{errors.semester.message}</span>
              )}
            </label>
          </div>
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
                  ? "Assign course"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
