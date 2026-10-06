import { apiRequest } from "./api";

export type SemesterFee = {
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

export type CreateSemesterFeeInput = {
  programId: string;
  amount: number;
  isActive?: boolean;
};

export type UpdateSemesterFeeInput = {
  amount?: number;
  isActive?: boolean;
};

export const semesterFeesApi = {
  list: () => apiRequest<SemesterFee[]>("/api/semester-fees"),
  create: (input: CreateSemesterFeeInput) =>
    apiRequest<SemesterFee>("/api/semester-fees", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateSemesterFeeInput) =>
    apiRequest<SemesterFee>(`/api/semester-fees/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<null>(`/api/semester-fees/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
