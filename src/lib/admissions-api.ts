import { apiRequest } from "./api";

export type AdmissionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMED"
  | "CANCELLED";

export type StudentAdmission = {
  id: string;
  admissionYear: number;
  admissionFee: string | number;
  status: AdmissionStatus;
  createdAt: string;
  confirmedAt?: string | null;
  program: {
    degreeType: string;
    department: { name: string };
  };
  transactions?: Array<{
    id: string;
    amount: string | number;
    status: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
};

export type CreateAdmissionInput = {
  programId: string;
  admissionYear: number;
};

export const admissionsApi = {
  mine: () => apiRequest<StudentAdmission[]>("/admissions/my"),
  create: (input: CreateAdmissionInput) =>
    apiRequest<StudentAdmission>("/admissions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
