import { apiRequest } from "./api";

export type RegistrationOffering = {
  id: string;
  courseId: string;
  teacherId: string;
  year: number;
  semester: number;
  capacity: number | null;
  course: { code: string; name: string; credits: number };
  teacher: { user: { name: string } };
  _count?: { enrollments: number };
};

export type CourseSelection = {
  id: string;
  status: "PENDING" | "ENROLLED" | "DROPPED" | string;
  courseOffering: { id: string; course: { code: string; name: string } };
};

export type CourseRegistrationPayment = {
  transaction: { id: string; amount: string | number; status: string };
  bkash: { paymentID: string; bkashURL: string; transactionStatus?: string };
};

export const courseRegistrationApi = {
  available: (studentSemesterId: string) =>
    apiRequest<RegistrationOffering[]>(
      `/api/course-registrations/${studentSemesterId}/offerings`,
    ),
  register: (studentSemesterId: string, courseOfferingId: string) =>
    apiRequest<CourseSelection>(
      `/api/course-registrations/${studentSemesterId}/courses`,
      { method: "POST", body: JSON.stringify({ courseOfferingId }) },
    ),
  drop: (studentSemesterId: string, courseOfferingId: string) =>
    apiRequest<null>(
      `/api/course-registrations/${studentSemesterId}/courses/${courseOfferingId}`,
      { method: "DELETE" },
    ),
  initiatePayment: (studentSemesterId: string) =>
    apiRequest<CourseRegistrationPayment>(
      `/api/student-semesters/${studentSemesterId}/course-payment/initiate`,
      { method: "POST" },
    ),
};
