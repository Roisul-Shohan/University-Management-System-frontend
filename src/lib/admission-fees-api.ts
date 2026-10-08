import { apiRequest } from "./api";

export type AdmissionFee = {
  id: string;
  programId: string;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  program?: {
    id: string;
    degreeType: string;
    department: {
      id: string;
      name: string;
      code: string;
    };
  };
};

export type CreateAdmissionFeeInput = {
  programId: string;
  amount: number;
  isActive?: boolean;
};

export type UpdateAdmissionFeeInput = {
  amount?: number;
  isActive?: boolean;
};

export const admissionFeesApi = {
  list: () => apiRequest<AdmissionFee[]>("/api/admission-fees"),
  create: (input: CreateAdmissionFeeInput) =>
    apiRequest<AdmissionFee>("/api/admission-fees", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getById: (id: string) =>
    apiRequest<AdmissionFee>(`/api/admission-fees/${encodeURIComponent(id)}`),
  update: (id: string, input: UpdateAdmissionFeeInput) =>
    apiRequest<AdmissionFee>(`/api/admission-fees/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<null>(`/api/admission-fees/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
