import { apiRequest } from "./api";

export type CreditFee = {
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

export type CreateCreditFeeInput = {
  programId: string;
  amount: number;
  isActive?: boolean;
};

export type UpdateCreditFeeInput = {
  amount?: number;
  isActive?: boolean;
};

export const creditFeesApi = {
  list: () => apiRequest<CreditFee[]>("/api/credit-fees"),
  create: (input: CreateCreditFeeInput) =>
    apiRequest<CreditFee>("/api/credit-fees", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getById: (id: string) => apiRequest<CreditFee>(`/api/credit-fees/${encodeURIComponent(id)}`),
  update: (id: string, input: UpdateCreditFeeInput) =>
    apiRequest<CreditFee>(`/api/credit-fees/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<null>(`/api/credit-fees/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
