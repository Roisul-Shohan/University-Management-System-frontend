const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

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

  return body?.data as T;
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
      if (typeof window !== "undefined") window.localStorage.removeItem("accessToken");
    }
  },
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "SUPER_ADMIN";
  status?: string;
};
