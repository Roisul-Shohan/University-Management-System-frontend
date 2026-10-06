import { apiRequest } from "./api";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type ExamType = "MIDTERM" | "FINAL";

export type Exam = {
  id: string;
  type: ExamType;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  startAt?: string | null;
  endAt?: string | null;
  status: ExamStatus;
  courseOffering: { course: { code: string; name: string } };
  _count?: { questions: number; attempts: number };
};

export type ExamInput = {
  courseOfferingId: string;
  type: ExamType;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  startAt?: string | null;
  endAt?: string | null;
};

export type AttemptQuestion = {
  id: string;
  prompt: string;
  marks: number;
  options: Array<{ id: string; text: string }>;
};

export type ExamAttempt = {
  id: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  score?: number | null;
  exam: { title: string; totalMarks: number; questions: AttemptQuestion[] };
  answers: Array<{ questionId: string; optionId?: string | null }>;
};

export const examsApi = {
  list: () => apiRequest<Exam[]>("/api/exams?status=PUBLISHED"),
  managerList: () => apiRequest<Exam[]>("/api/exams"),
  create: (input: ExamInput) =>
    apiRequest<Exam>("/api/exams", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  publish: (id: string) =>
    apiRequest<Exam>(`/api/exams/${id}/publish`, { method: "PATCH" }),
  close: (id: string) =>
    apiRequest<Exam>(`/api/exams/${id}/close`, { method: "PATCH" }),
  start: (examId: string) =>
    apiRequest<ExamAttempt>(`/api/exams/${examId}/start`, { method: "POST" }),
  attempt: (attemptId: string) =>
    apiRequest<ExamAttempt>(`/api/attempts/${attemptId}`),
  submit: (
    attemptId: string,
    answers: Array<{ questionId: string; optionId?: string | null }>,
  ) =>
    apiRequest<{ id: string; score: number; submittedAt: string }>(
      `/api/attempts/${attemptId}/submit`,
      { method: "POST", body: JSON.stringify({ answers }) },
    ),
};
