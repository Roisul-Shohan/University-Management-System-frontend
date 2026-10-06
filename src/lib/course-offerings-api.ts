import { apiRequest, type Course } from "@/lib/api";

export type OfferingTeacher = {
  id: string;
  teacherId: string;
  departmentId: string;
  department: { id: string; name: string; code: string };
  user: { id: string; name: string; email: string; status?: string };
};

export type CourseOffering = {
  id: string;
  courseId: string;
  teacherId: string;
  year: number;
  semester: number;
  capacity: number | null;
  course: Course;
  teacher: OfferingTeacher;
  _count?: { enrollments: number; classSession: number };
};

export type CourseOfferingInput = {
  courseId: string;
  teacherId: string;
  year: number;
  semester: number;
  capacity?: number | null;
};

export const courseOfferingsApi = {
  list: (params: Partial<CourseOfferingInput> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        query.set(key, String(value));
    });
    return apiRequest<CourseOffering[]>(
      `/api/course-offerings${query.size ? `?${query}` : ""}`,
    );
  },
  create: (input: CourseOfferingInput) =>
    apiRequest<CourseOffering>("/api/course-offerings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<CourseOfferingInput>) =>
    apiRequest<CourseOffering>(`/api/course-offerings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiRequest<null>(`/api/course-offerings/${id}`, { method: "DELETE" }),
};

export const teachersApi = {
  list: () => apiRequest<OfferingTeacher[]>("/api/teachers"),
};
