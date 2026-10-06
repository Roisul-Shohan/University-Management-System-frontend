"use client";

import { CheckCircle2, ClipboardList, Clock3, LoaderCircle, Plus, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthGuard } from "../auth-provider";
import { courseOfferingsApi } from "@/lib/course-offerings-api";
import { examsApi, type ExamStatus } from "@/lib/exams-api";
import styles from "./exam-management.module.css";

const examSchema = z.object({
  courseOfferingId: z.string().min(1, "Choose a course offering."),
  type: z.enum(["MIDTERM", "FINAL"]),
  title: z.string().trim().min(2).max(200),
  durationMinutes: z.string().refine((value) => Number(value) > 0 && Number.isInteger(Number(value)), "Enter a positive whole number."),
  totalMarks: z.string().refine((value) => Number(value) > 0 && Number.isInteger(Number(value)), "Enter positive whole marks."),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
}).refine((values) => !values.startAt || !values.endAt || values.startAt < values.endAt, { message: "Start time must be before end time.", path: ["endAt"] });

type ExamValues = z.infer<typeof examSchema>;

export default function ExamManagementPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["SUPER_ADMIN", "TEACHER"]);
  const queryClient = useQueryClient();
  const examsQuery = useQuery({ queryKey: ["exams", "manager"], queryFn: examsApi.managerList, enabled: !!user, retry: false });
  const offeringsQuery = useQuery({ queryKey: ["course-offerings", "all"], queryFn: () => courseOfferingsApi.list(), enabled: !!user, retry: false });
  const lifecycleMutation = useMutation({ mutationFn: ({ id, action }: { id: string; action: "publish" | "close" }) => action === "publish" ? examsApi.publish(id) : examsApi.close(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams", "manager"] }) });
  const createMutation = useMutation({ mutationFn: examsApi.create, onSuccess: async () => { reset(); await queryClient.invalidateQueries({ queryKey: ["exams", "manager"] }); } });
  const form = useForm<ExamValues>({ resolver: zodResolver(examSchema), defaultValues: { courseOfferingId: "", type: "MIDTERM", title: "", durationMinutes: "60", totalMarks: "100", startAt: "", endAt: "" } });
  const { reset } = form;

  if (checkingAccess || !user) return <main className={styles.loading}>Checking examiner access...</main>;
  const error = examsQuery.error ?? offeringsQuery.error ?? createMutation.error ?? lifecycleMutation.error;
  const exams = examsQuery.data ?? [];

  function submit(values: ExamValues) {
    createMutation.mutate({ courseOfferingId: values.courseOfferingId, type: values.type, title: values.title, durationMinutes: Number(values.durationMinutes), totalMarks: Number(values.totalMarks), startAt: values.startAt || null, endAt: values.endAt || null });
  }

  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}>Academics / Assessments</p><h1>Exam management</h1><p className={styles.subtitle}>Create, schedule, publish, and close course assessments.</p></div><ClipboardList size={28} className={styles.icon} /></header><div className={styles.layout}><section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.kicker}>New assessment</p><h2>Create exam</h2></div><Plus size={20} /></div><form className={styles.form} onSubmit={form.handleSubmit(submit)}><label>Course offering<select {...form.register("courseOfferingId")}><option value="">Choose an offering</option>{(offeringsQuery.data ?? []).map((offering) => <option key={offering.id} value={offering.id}>{offering.course.code} · Year {offering.year} / Semester {offering.semester}</option>)}</select>{form.formState.errors.courseOfferingId && <span>{form.formState.errors.courseOfferingId.message}</span>}</label><label>Exam type<select {...form.register("type")}><option value="MIDTERM">Midterm</option><option value="FINAL">Final</option></select></label><label>Title<input {...form.register("title")} placeholder="Midterm examination" />{form.formState.errors.title && <span>{form.formState.errors.title.message}</span>}</label><div className={styles.two}><label>Duration<input type="number" {...form.register("durationMinutes")} />{form.formState.errors.durationMinutes && <span>{form.formState.errors.durationMinutes.message}</span>}</label><label>Total marks<input type="number" {...form.register("totalMarks")} />{form.formState.errors.totalMarks && <span>{form.formState.errors.totalMarks.message}</span>}</label></div><div className={styles.two}><label>Starts<input type="datetime-local" {...form.register("startAt")} /></label><label>Ends<input type="datetime-local" {...form.register("endAt")} />{form.formState.errors.endAt && <span>{form.formState.errors.endAt.message}</span>}</label></div>{createMutation.error && <p className={styles.error}>{createMutation.error instanceof Error ? createMutation.error.message : "Unable to create exam."}</p>}<button className={styles.primary} disabled={createMutation.isPending} type="submit">{createMutation.isPending ? "Creating..." : "Create exam"}</button></form></section><section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.kicker}>Lifecycle</p><h2>{exams.length} exams</h2></div><Clock3 size={20} /></div>{error && <p className={styles.error}>{error instanceof Error ? error.message : "Unable to load exams."}</p>}{examsQuery.isPending ? <div className={styles.loading}><LoaderCircle className={styles.spin} size={21} /> Loading exams...</div> : <div className={styles.list}>{exams.map((exam) => <ExamCard key={exam.id} status={exam.status} title={exam.title} course={exam.courseOffering.course.code} questions={exam._count?.questions ?? 0} busy={lifecycleMutation.isPending} onAction={(action) => lifecycleMutation.mutate({ id: exam.id, action })} />)}</div>}</section></div></main>;
}

function ExamCard({ status, title, course, questions, busy, onAction }: { status: ExamStatus; title: string; course: string; questions: number; busy: boolean; onAction: (action: "publish" | "close") => void }) {
  return <article className={styles.card}><div className={styles.cardTop}><span className={`${styles.status} ${styles[status.toLowerCase()]}`}>{status}</span><span>{questions} questions</span></div><h3>{title}</h3><p>{course}</p>{status === "DRAFT" && <button className={styles.publish} disabled={busy} onClick={() => onAction("publish")}><CheckCircle2 size={15} /> Publish</button>}{status === "PUBLISHED" && <button className={styles.close} disabled={busy} onClick={() => onAction("close")}><XCircle size={15} /> Close exam</button>}</article>;
}
