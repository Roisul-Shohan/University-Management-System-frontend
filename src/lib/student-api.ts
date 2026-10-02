import { apiRequest, type Department, type Program } from "@/lib/api";

export type Student = {
  id: string;
  studentId: string;
  admissionYear: number;
  programId: string;
  currentYear: number;
  currentSemester: number;
  isActive: boolean;
  programStatus: "ACTIVE" | "GRADUATED" | "SUSPENDED" | "WITHDRAWN";
  program: Program & { department: Department };
};

export type StudentQuery = {
  programId?: string;
  departmentId?: string;
  admissionYear?: number;
  currentYear?: number;
  currentSemester?: number;
  isActive?: boolean;
};

export const studentsApi = {
  list: (params: StudentQuery = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return apiRequest<Student[]>(`/api/students${query.size ? `?${query}` : ""}`);
  },
  getByStudentId: (studentId: string) => apiRequest<Student>(`/api/students/${encodeURIComponent(studentId)}`),
  me: () => apiRequest<Student>("/api/students/me"),
};
