import { apiRequest } from "./api";

export type Teacher = {
  id: string;
  departmentId: string;
  designation?: string | null;
  isDeptAdmin: boolean;
  joiningYear?: number | null;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  user: {
    id: string;
    name: string;
    email: string;
    role: "TEACHER";
    status?: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
};

export type TeacherApplication = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  joiningYear?: number | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
};

export type ApplyTeacherInput = {
  departmentId: string;
  joiningYear?: number;
};

export type UpdateTeacherAdminInput = {
  isDeptAdmin: boolean;
};

export type TeachersQuery = {
  departmentId?: string;
  isDeptAdmin?: boolean;
};

export const teachersApi = {
  list: (params: TeachersQuery = {}) => {
    const query = new URLSearchParams();
    if (params.departmentId) query.set("departmentId", params.departmentId);
    if (params.isDeptAdmin !== undefined)
      query.set("isDeptAdmin", String(params.isDeptAdmin));
    return apiRequest<Teacher[]>(`/api/teachers${query.size ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiRequest<Teacher>(`/api/teachers/${encodeURIComponent(id)}`),
  apply: (input: ApplyTeacherInput) =>
    apiRequest<Teacher>("/api/teachers/apply", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => apiRequest<Teacher>("/api/teachers/me"),
  myApplication: () => apiRequest<TeacherApplication>("/api/teachers/applications/me"),
  applications: (params: { status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    return apiRequest<TeacherApplication[]>(
      `/api/teachers/applications${query.size ? `?${query}` : ""}`,
    );
  },
  updateAdminStatus: (id: string, input: UpdateTeacherAdminInput) =>
    apiRequest<Teacher>(`/api/teachers/${encodeURIComponent(id)}/admin-status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  approveApplication: (id: string) =>
    apiRequest<TeacherApplication>(`/api/teachers/applications/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
    }),
  rejectApplication: (id: string, rejectionReason?: string) =>
    apiRequest<TeacherApplication>(`/api/teachers/applications/${encodeURIComponent(id)}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),
};
