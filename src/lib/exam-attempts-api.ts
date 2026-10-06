import { apiRequest } from "./api";

export type ExamAttempt = {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string | null;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  score?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type StartExamResponse = {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  status: string;
};

export const examAttemptsApi = {
  start: (examId: string) =>
    apiRequest<StartExamResponse>("/api/exam-attempts/exams/start", {
      method: "POST",
      body: JSON.stringify({ examId }),
    }),
  get: (attemptId: string) =>
    apiRequest<ExamAttempt>(`/api/exam-attempts/attempts/${encodeURIComponent(attemptId)}`),
  submit: (attemptId: string) =>
    apiRequest<ExamAttempt>(`/api/exam-attempts/attempts/${encodeURIComponent(attemptId)}/submit`, {
      method: "POST",
    }),
};
