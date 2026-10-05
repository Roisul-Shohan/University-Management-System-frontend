"use client";

import {
  BookOpen,
  Edit3,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthGuard } from "../auth-provider";
import { coursesApi, type Course } from "@/lib/api";
import {
  courseOfferingsApi,
  teachersApi,
  type CourseOffering,
  type OfferingTeacher,
} from "@/lib/course-offerings-api";
import styles from "./offerings.module.css";

const offeringSchema = z.object({
  courseId: z.string().min(1, "Choose a course."),
  teacherId: z.string().min(1, "Choose an instructor."),
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
  capacity: z
    .string()
    .refine(
      (value) =>
        value === "" || (Number.isInteger(Number(value)) && Number(value) > 0),
      "Capacity must be a positive whole number.",
    ),
});

type OfferingValues = z.infer<typeof offeringSchema>;

export default function CourseOfferingsPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN"]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [modal, setModal] = useState<CourseOffering | "create" | null>(null);

  async function loadOfferings(nextYear = year, nextSemester = semester) {
    setLoading(true);
    setError("");
    try {
      setOfferings(
        await courseOfferingsApi.list({
          year: nextYear ? Number(nextYear) : undefined,
          semester: nextSemester ? Number(nextSemester) : undefined,
        }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load course offerings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    courseOfferingsApi
      .list()
      .then((result) => {
        setOfferings(result);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load course offerings.",
        );
        setLoading(false);
      });
  }, [user]);

  async function deleteOffering(offering: CourseOffering) {
    if (!window.confirm(`Delete the ${offering.course.code} offering?`)) return;
    try {
      await courseOfferingsApi.remove(offering.id);
      await loadOfferings();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this offering.",
      );
    }
  }

  if (checkingAccess || !user || (loading && offerings.length === 0))
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <BookOpen size={22} />
        </div>
        <p>Loading course offerings...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Delivery</p>
          <h1>Course offerings</h1>
          <p className="subtitle">
            Assign instructors and capacity to courses for each academic term.
          </p>
        </div>
        <button className="primary-button" onClick={() => setModal("create")}>
          <Plus size={17} /> New offering
        </button>
      </header>
      <div className={styles.filters}>
        <div>
          <label>
            Year
            <select
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                void loadOfferings(event.target.value, semester);
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
                void loadOfferings(year, event.target.value);
              }}
            >
              <option value="">All semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </label>
        </div>
        <span>{offerings.length} offerings</span>
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
          <span>Instructor</span>
          <span>Term</span>
          <span>Capacity</span>
          <span>Actions</span>
        </div>
        {offerings.map((offering) => (
          <article className={styles.row} key={offering.id}>
            <div className={styles.course}>
              <div className={styles.icon}>
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{offering.course.code}</strong>
                <span>{offering.course.name}</span>
              </div>
            </div>
            <div className={styles.teacher}>
              <strong>{offering.teacher.user.name}</strong>
              <span>
                {offering.teacher.department.code} ·{" "}
                {offering.teacher.user.email}
              </span>
            </div>
            <div className={styles.term}>
              <strong>Year {offering.year}</strong>
              <span>Semester {offering.semester}</span>
            </div>
            <div className={styles.capacity}>
              <strong>
                {offering._count?.enrollments ?? 0}
                {offering.capacity ? ` / ${offering.capacity}` : ""}
              </strong>
              <span>enrolled</span>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => setModal(offering)}
                aria-label="Edit offering"
              >
                <Edit3 size={15} />
              </button>
              <button
                className={styles.danger}
                onClick={() => deleteOffering(offering)}
                aria-label="Delete offering"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </section>
      {offerings.length === 0 && !loading && (
        <div className="department-state">
          <Users size={25} />
          <strong>No course offerings found</strong>
          <span>
            Create an offering to assign an instructor to a course term.
          </span>
        </div>
      )}
      {modal && (
        <OfferingModal
          mode={modal === "create" ? "create" : "edit"}
          offering={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadOfferings();
          }}
        />
      )}
    </main>
  );
}

function OfferingModal({
  mode,
  offering,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  offering?: CourseOffering;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<OfferingTeacher[]>([]);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferingValues>({
    resolver: zodResolver(offeringSchema),
    defaultValues: {
      courseId: offering?.courseId ?? "",
      teacherId: offering?.teacherId ?? "",
      year: String(offering?.year ?? 1),
      semester: String(offering?.semester ?? 1),
      capacity: offering?.capacity ? String(offering.capacity) : "",
    },
  });
  useEffect(() => {
    Promise.all([coursesApi.list(), teachersApi.list()])
      .then(([courseResult, teacherResult]) => {
        setCourses(courseResult);
        setTeachers(teacherResult);
      })
      .catch(() => setError("Unable to load courses and instructors."));
  }, []);
  async function submit(values: OfferingValues) {
    setError("");
    try {
      const capacity = values.capacity ? Number(values.capacity) : null;
      const input = {
        courseId: values.courseId,
        teacherId: values.teacherId,
        year: Number(values.year),
        semester: Number(values.semester),
        capacity,
      };
      if (mode === "create") await courseOfferingsApi.create(input);
      else if (offering)
        await courseOfferingsApi.update(offering.id, {
          teacherId: values.teacherId,
          year: Number(values.year),
          semester: Number(values.semester),
          capacity,
        });
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this offering.",
      );
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Course delivery</p>
            <h2>{mode === "create" ? "Create offering" : "Edit offering"}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit(submit)}>
          {mode === "create" && (
            <label>
              Course
              <select {...register("courseId")}>
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.name}
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <span className="field-error">{errors.courseId.message}</span>
              )}
            </label>
          )}
          <label>
            Instructor
            <select {...register("teacherId")}>
              <option value="">Choose an instructor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.name} · {teacher.department.code}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <span className="field-error">{errors.teacherId.message}</span>
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
          <label>
            Capacity
            <input
              type="number"
              min="1"
              step="1"
              {...register("capacity")}
              placeholder="Unlimited"
            />
            {errors.capacity && (
              <span className="field-error">{errors.capacity.message}</span>
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
                  ? "Create offering"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
