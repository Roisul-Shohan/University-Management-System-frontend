import { apiRequest } from "./api";

export type ClassSession = {
  id: string;
  courseOfferingId: string;
  year: number;
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string | null;
  meetingLink?: string | null;
  courseOffering?: {
    id: string;
    course: {
      code: string;
      name: string;
      department: {
        id: string;
        name: string;
        code: string;
      };
    };
    teacher: {
      id: string;
      user: {
        id: string;
        name: string;
      };
    };
  };
};

export type CreateClassSessionInput = {
  courseOfferingId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic?: string;
  meetingLink?: string;
};

export type UpdateClassSessionInput = {
  date?: string;
  startTime?: string;
  endTime?: string;
  topic?: string | null;
  meetingLink?: string | null;
};

export type ClassSessionsQuery = {
  courseOfferingId?: string;
  from?: string;
  to?: string;
};

export const classSessionsApi = {
  list: (params: ClassSessionsQuery = {}) => {
    const query = new URLSearchParams();
    if (params.courseOfferingId) query.set("courseOfferingId", params.courseOfferingId);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return apiRequest<ClassSession[]>(
      `/api/class-sessions${query.size ? `?${query}` : ""}`,
    );
  },
  getById: (id: string) =>
    apiRequest<ClassSession>(`/api/class-sessions/${encodeURIComponent(id)}`),
  create: (input: CreateClassSessionInput) =>
    apiRequest<ClassSession>("/api/class-sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateClassSessionInput) =>
    apiRequest<ClassSession>(`/api/class-sessions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<null>(`/api/class-sessions/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
