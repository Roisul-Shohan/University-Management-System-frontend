import { apiRequest } from "./api";

export type StudentSemesterStatus =
  | "PENDING"
  | "REGISTERED"
  | "ACTIVE"
  | "COMPLETED"
  | "DROPPED"
  | "CANCELLED";

export type StudentSemester = {
  id: string;
  year: number;
  semester: number;
  status: StudentSemesterStatus;
  registeredAt?: string | null;
  createdAt: string;
};

export type StudentProfile = {
  id: string;
  studentId: string;
  currentYear: number;
  currentSemester: number;
  program: { degreeType: string; department: { name: string } };
  semesters: StudentSemester[];
};

export type SemesterPayment = {
  transaction: { id: string; amount: string | number; status: string };
  bkash: { paymentID: string; bkashURL: string; transactionStatus?: string };
};

export const semesterRegistrationApi = {
  profile: () => apiRequest<StudentProfile>("/api/students/me"),
  initiatePayment: (studentSemesterId: string) =>
    apiRequest<SemesterPayment>(
      `/api/student-semesters/${studentSemesterId}/payment/initiate`,
      { method: "POST" },
    ),
};
