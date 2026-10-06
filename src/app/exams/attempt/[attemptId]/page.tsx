"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "../../../auth-provider";
import { examsApi } from "@/lib/exams-api";
import styles from "./attempt.module.css";

const attemptSchema = z.object({ answers: z.record(z.string(), z.string().optional()) });
type AttemptValues = z.infer<typeof attemptSchema>;

export default function ExamAttemptPage() {
  const { user, loading: checkingAccess } = useAuthGuard(["STUDENT"]);
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<{ score: number; submittedAt: string } | null>(null);
  const attemptQuery = useQuery({ queryKey: ["exam-attempt", params.attemptId], queryFn: () => examsApi.attempt(params.attemptId), enabled: !!user && !!params.attemptId, retry: false });
  const submitMutation = useMutation({ mutationFn: (answers: Array<{ questionId: string; optionId?: string | null }>) => examsApi.submit(params.attemptId, answers), onSuccess: (submission) => setResult(submission) });
  const form = useForm<AttemptValues>({ resolver: zodResolver(attemptSchema), defaultValues: { answers: {} } });

  if (checkingAccess || !user) return <main className={styles.loading}>Checking student access...</main>;
  if (attemptQuery.isPending) return <main className={styles.loading}><LoaderCircle className={styles.spin} size={22} /> Loading exam...</main>;
  if (attemptQuery.error || !attemptQuery.data) return <main className={styles.error}><AlertTriangle size={24} />Unable to load this exam attempt.</main>;
  const attempt = attemptQuery.data;

  if (result) return <main className={styles.result}><CheckCircle2 size={42} /><h1>Exam submitted</h1><p>Your score: <strong>{result.score}</strong></p><button onClick={() => router.push("/exams")}>Back to exams</button></main>;

  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}>Assessment</p><h1>{attempt.exam.title}</h1><p>{attempt.exam.questions.length} questions · {attempt.exam.totalMarks} marks</p></div><time>Submit before {new Date(attempt.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></header><form className={styles.form} onSubmit={form.handleSubmit((values) => submitMutation.mutate(Object.entries(values.answers).map(([questionId, optionId]) => ({ questionId, optionId: optionId || null }))))}>{attempt.exam.questions.map((question, index) => <fieldset className={styles.question} key={question.id}><legend>{index + 1}. {question.prompt} <small>{question.marks} marks</small></legend>{question.options.map((option) => <label key={option.id}><input type="radio" value={option.id} {...form.register(`answers.${question.id}` as const)} />{option.text}</label>)}</fieldset>)}{submitMutation.error && <p className={styles.error} role="alert">{submitMutation.error instanceof Error ? submitMutation.error.message : "Unable to submit exam."}</p>}<button className={styles.submit} type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? "Submitting..." : "Submit exam"}</button></form></main>;
}
