const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
  login: (email: string, password: string) =>
    apiRequest<{ user: User; accessToken?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiRequest<User>("/api/auth/me"),
  logout: () => apiRequest<null>("/api/auth/logout", { method: "POST" }),
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "SUPER_ADMIN";
  status?: string;
};
