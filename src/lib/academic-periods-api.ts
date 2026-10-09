import { apiRequest } from "./api";

export type AcademicPeriod = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "UPCOMING" | "COMPLETED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const academicPeriodsApi = {
  list: () => apiRequest<AcademicPeriod[]>("/api/academic-periods"),
  get: (id: string) => apiRequest<AcademicPeriod>(`/api/academic-periods/${encodeURIComponent(id)}`),
  create: (input: { type: string; startDate: string; endDate: string; status: "ACTIVE" | "UPCOMING" | "COMPLETED" }) =>
    apiRequest<AcademicPeriod>("/api/academic-periods", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: { type: string; startDate: string; endDate: string; status: "ACTIVE" | "UPCOMING" | "COMPLETED" }) =>
    apiRequest<AcademicPeriod>(`/api/academic-periods/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<void>(`/api/academic-periods/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};