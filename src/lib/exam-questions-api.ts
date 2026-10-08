import { apiRequest } from "./api";

export type QuestionOption = {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
};

export type ExamQuestion = {
  id: string;
  examId: string;
  questionText: string;
  marks: number;
  order: number;
  options: QuestionOption[];
  createdAt: string;
  updatedAt: string;
};

export type CreateExamQuestionInput = {
  questionText: string;
  marks: number;
  order: number;
  options: QuestionOption[];
};

export type UpdateExamQuestionInput = {
  questionText?: string;
  marks?: number;
  order?: number;
  options?: QuestionOption[];
};

export const examQuestionsApi = {
  list: (examId: string) =>
    apiRequest<ExamQuestion[]>(`/api/exam-questions/${encodeURIComponent(examId)}`),
  create: (examId: string, input: CreateExamQuestionInput) =>
    apiRequest<ExamQuestion>(`/api/exam-questions/${encodeURIComponent(examId)}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (examId: string, questionId: string, input: UpdateExamQuestionInput) =>
    apiRequest<ExamQuestion>(
      `/api/exam-questions/${encodeURIComponent(examId)}/${encodeURIComponent(questionId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    ),
  remove: (examId: string, questionId: string) =>
    apiRequest<null>(
      `/api/exam-questions/${encodeURIComponent(examId)}/${encodeURIComponent(questionId)}`,
      { method: "DELETE" },
    ),
};
