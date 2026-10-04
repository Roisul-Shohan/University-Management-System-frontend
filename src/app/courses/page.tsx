"use client";

import { BookOpen, Edit3, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  authApi,
  coursesApi,
  departmentsApi,
  type Course,
  type Department,
  type User,
} from "@/lib/api";
import styles from "./courses.module.css";

const courseSchema = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(150),
  credits: z.string().refine((value) => Number(value) > 0, {
    message: "Credits must be greater than zero.",
  }),
  departmentId: z.string().min(1, "Choose a department."),
});

type CourseValues = z.infer<typeof courseSchema>;

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
    setLoading(true);
    setError("");
    try {
      setCourses(await coursesApi.list(filter || undefined));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load courses.",
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
        const [courseResult, departmentResult] = await Promise.all([
          coursesApi.list(),
          departmentsApi.list(),
        ]);
        setCourses(courseResult);
        setDepartments(departmentResult);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete ${course.code} · ${course.name}?`)) return;
    setError("");
    try {
      await coursesApi.remove(course.id);
      await loadCourses();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this course.",
      );
    }
  }

  if (!user || (loading && courses.length === 0))
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <BookOpen size={22} />
        </div>
        <p>Loading courses...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Catalog</p>
          <h1>Courses</h1>
          <p className="subtitle">
            Manage the course catalog that powers programs, offerings, and
            enrollment.
          </p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => setModal("create")}>
            <Plus size={17} /> New course
          </button>
        )}
      </header>
      <div className={styles.toolbar}>
        <div className={styles.count}>
          <BookOpen size={18} />
          <span>{courses.length} courses</span>
        </div>
        <select
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(event.target.value);
            void loadCourses(event.target.value);
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
      <section className={styles.table}>
        {courses.map((course) => (
          <article className={styles.row} key={course.id}>
            <div className={styles.courseIcon}>
              <BookOpen size={18} />
            </div>
            <div className={styles.courseMain}>
              <strong>{course.code}</strong>
              <span>{course.name}</span>
            </div>
            <div className={styles.department}>
              {course.department.code}
              <small>{course.department.name}</small>
            </div>
            <div className={styles.credits}>
              <strong>{course.credits}</strong>
              <span>credits</span>
            </div>
            {canManage && (
              <div className={styles.actions}>
                <button
                  onClick={() => setModal(course)}
                  aria-label={`Edit ${course.code}`}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className={styles.danger}
                  onClick={() => deleteCourse(course)}
                  aria-label={`Delete ${course.code}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      {courses.length === 0 && !loading && (
        <div className="department-state">
          <BookOpen size={25} />
          <strong>No courses found</strong>
          <span>Create a course or change the department filter.</span>
        </div>
      )}
      {modal && (
        <CourseModal
          mode={modal === "create" ? "create" : "edit"}
          course={modal === "create" ? undefined : modal}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadCourses();
          }}
        />
      )}
    </main>
  );
}

function CourseModal({
  mode,
  course,
  departments,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  course?: Course;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code ?? "",
      name: course?.name ?? "",
      credits: course ? String(course.credits) : "",
      departmentId: course?.departmentId ?? departments[0]?.id ?? "",
    },
  });

  async function submit(values: CourseValues) {
    setError("");
    try {
      if (mode === "create")
        await coursesApi.create({
          code: values.code,
          name: values.name,
          credits: Number(values.credits),
          departmentId: values.departmentId,
        });
      else if (course)
        await coursesApi.update(course.id, {
          code: values.code,
          name: values.name,
          credits: Number(values.credits),
        });
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this course.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Course catalog</p>
            <h2>{mode === "create" ? "Create course" : "Edit course"}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit(submit)}>
          <div className={styles.formGrid}>
            <label>
              Course code
              <input
                {...register("code", {
                  setValueAs: (value: string) => value.toUpperCase(),
                })}
                placeholder="CSE 201"
              />
              {errors.code && <span className="field-error">{errors.code.message}</span>}
            </label>
            <label>
              Credits
              <input type="number" step="0.5" {...register("credits")} />
              {errors.credits && <span className="field-error">{errors.credits.message}</span>}
            </label>
          </div>
          <label>
            Course name
            <input {...register("name")} placeholder="Data Structures and Algorithms" />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </label>
          {mode === "create" && (
            <label>
              Department
              <select {...register("departmentId")}>
                <option value="">Choose a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} ({department.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && <span className="field-error">{errors.departmentId.message}</span>}
            </label>
          )}
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
                  ? "Create course"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
