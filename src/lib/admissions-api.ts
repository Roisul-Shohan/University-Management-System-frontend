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

export type ReviewAdmission = {
  id: string;
  admissionYear: number;
  admissionFee: string | number;
  status: AdmissionStatus;
  createdAt: string;
  user: { name: string; email: string; status: string };
  program: {
    degreeType: string;
    department: { name: string };
  };
};

export const admissionsApi = {
  mine: () => apiRequest<StudentAdmission[]>("/admissions/my"),
  create: (input: CreateAdmissionInput) =>
    apiRequest<StudentAdmission>("/admissions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  reviewList: (
    params: { status?: AdmissionStatus; admissionYear?: number } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.admissionYear)
      query.set("admissionYear", String(params.admissionYear));
    return apiRequest<ReviewAdmission[]>(
      `/admissions${query.size ? `?${query}` : ""}`,
    );
  },
  approve: (id: string) =>
    apiRequest<ReviewAdmission>(`/admissions/${id}/approve`, {
      method: "PATCH",
    }),
  reject: (id: string) =>
    apiRequest<ReviewAdmission>(`/admissions/${id}/reject`, {
      method: "PATCH",
    }),
};
