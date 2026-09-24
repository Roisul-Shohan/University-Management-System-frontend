const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type ApiEnvelope<T> = {
  data: T;
  message: string;
  meta?: { page: number; limit: number; total: number };
};

async function requestEnvelope<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? "Something went wrong. Please try again.");
  }

  return body as ApiEnvelope<T>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const body = await requestEnvelope<T>(path, options);
  return body.data;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const result = await apiRequest<{ user: User; accessToken?: string }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    if (result.accessToken && typeof window !== "undefined") {
      window.localStorage.setItem("accessToken", result.accessToken);
    }
    return result;
  },
  me: () => apiRequest<User>("/api/auth/me"),
  logout: async () => {
    try {
      return await apiRequest<null>("/api/auth/logout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined")
        window.localStorage.removeItem("accessToken");
    }
  },
};

export const academicPeriodsApi = {
  list: async (params: AcademicPeriodQuery = {}) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 8),
      sortBy: "startDate",
      sortOrder: "desc",
      ...(params.type ? { type: params.type } : {}),
      ...(params.isActive !== undefined
        ? { isActive: String(params.isActive) }
        : {}),
    });
    return requestEnvelope<AcademicPeriod[]>(`/api/academic-periods?${query}`);
  },
  create: (input: AcademicPeriodInput) =>
    apiRequest<AcademicPeriod>("/api/academic-periods", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<AcademicPeriodInput>) =>
    apiRequest<AcademicPeriod>(`/api/academic-periods/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  setActive: (id: string, isActive: boolean) =>
    apiRequest<AcademicPeriod>(`/api/academic-periods/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
};

export const academicPeriodTypes = [
  "ADMISSION",
  "SEMESTER_REGISTRATION",
  "COURSE_REGISTRATION",
  "MIDTERM_EXAM",
  "FINAL_EXAM",
  "RESULT_PUBLICATION",
] as const;

export type AcademicPeriodType = (typeof academicPeriodTypes)[number];
export type AcademicPeriodInput = {
  type: AcademicPeriodType;
  startDate: string;
  endDate: string;
};
export type AcademicPeriod = AcademicPeriodInput & {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AcademicPeriodQuery = {
  page?: number;
  limit?: number;
  type?: AcademicPeriodType;
  isActive?: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "SUPER_ADMIN";
  status?: string;
};
