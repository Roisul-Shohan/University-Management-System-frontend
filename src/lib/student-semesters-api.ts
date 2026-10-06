import { apiRequest } from "./api";

export type StudentSemester = {
  id: string;
  studentId: string;
  year: number;
  semester: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "WITHDRAWN";
  createdAt: string;
  updatedAt: string;
};

export type InitiatePaymentResponse = {
  transactionId: string;
  bkashURL?: string;
  paymentID?: string;
  transactionStatus?: string;
};

export const studentSemestersApi = {
  initiatePayment: (studentSemesterId: string) =>
    apiRequest<InitiatePaymentResponse>(
      `/api/student-semesters/${encodeURIComponent(studentSemesterId)}/payment/initiate`,
      { method: "POST" },
    ),
  initiateCoursePayment: (studentSemesterId: string) =>
    apiRequest<InitiatePaymentResponse>(
      `/api/student-semesters/${encodeURIComponent(studentSemesterId)}/course-payment/initiate`,
      { method: "POST" },
    ),
};
