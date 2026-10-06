"use client";

import { ClipboardList, Clock3, LoaderCircle, PlayCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "../auth-provider";
import { examsApi } from "@/lib/exams-api";
import styles from "./exams.module.css";

export default function ExamsPage() {
  const router = useRouter();
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const examsQuery = useQuery({ queryKey: ["exams", "published"], queryFn: examsApi.list, enabled: !!user, retry: false });
  const startMutation = useMutation({ mutationFn: examsApi.start, onSuccess: (attempt) => router.push(`/exams/attempt/${attempt.id}`) });

  if (checkingAccess || !user) return <main className={styles.loading}>Checking student access...</main>;
  const error = examsQuery.error ?? startMutation.error;
  const exams = examsQuery.data ?? [];

  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}>Student services / Assessments</p><h1>My exams</h1><p className={styles.subtitle}>Open published assessments when their scheduled window is available.</p></div><ClipboardList size={27} className={styles.icon} /></header>{error && <p className={styles.error} role="alert">{error instanceof Error ? error.message : "Unable to load exams."}</p>}{examsQuery.isPending ? <div className={styles.loading}><LoaderCircle className={styles.spin} size={21} /> Loading exams...</div> : exams.length === 0 ? <div className={styles.empty}><ClipboardList size={30} /><strong>No published exams</strong><span>Published assessments will appear here.</span></div> : <section className={styles.grid}>{exams.map((exam) => <article className={styles.card} key={exam.id}><div className={styles.top}><span className={styles.type}>{exam.type}</span><span className={styles.status}>{exam.status}</span></div><h2>{exam.title}</h2><p>{exam.courseOffering.course.code} · {exam.courseOffering.course.name}</p><div className={styles.meta}><span><Clock3 size={15} /> {exam.durationMinutes} minutes</span><span>{exam.totalMarks} marks</span></div><button className={styles.start} disabled={startMutation.isPending} onClick={() => startMutation.mutate(exam.id)}><PlayCircle size={17} />{startMutation.isPending ? "Starting..." : "Start exam"}</button></article>)}</section>}</main>;
}
