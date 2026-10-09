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
  exam?: {
    id: string;
    title: string;
    type: string;
    status: string;
    durationMinutes: number;
    totalMarks: number;
    courseOffering?: {
      course: { id: string; code: string; name: string };
    };
  };
};

export type StartExamResponse = {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  status: string;
};

export const examAttemptsApi = {
  list: () => apiRequest<ExamAttempt[]>("/api/exam-attempts"),
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
