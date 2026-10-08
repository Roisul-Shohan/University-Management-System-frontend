import { apiRequest } from "./api";

export type AttendanceSession = {
  id: string;
  classSessionId: string;
  qrToken?: string;
  status: string;
  openedAt: string;
  expiresAt: string;
  classSession?: {
    id: string;
    courseOffering: {
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
  attendanceRecords?: Array<{
    id: string;
    status: string;
    markedAt?: string;
    courseEnrollment: {
      id: string;
      studentSemester: {
        student: {
          id: string;
          studentId: string;
          user: {
            id: string;
            name: string;
            email: string;
          };
        };
      };
    };
  }>;
};

export type OpenAttendanceInput = {
  classSessionId: string;
  durationMinutes?: number;
};

export type MarkAttendanceInput = {
  qrToken: string;
};

export type UpdateAttendanceRecordInput = {
  status: string;
};

export const attendanceApi = {
  listSessions: () => apiRequest<AttendanceSession[]>("/api/attendance/sessions"),
  getSession: (id: string) =>
    apiRequest<AttendanceSession>(`/api/attendance/sessions/${encodeURIComponent(id)}`),
  openSession: (input: OpenAttendanceInput) =>
    apiRequest<AttendanceSession>("/api/attendance/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  closeSession: (id: string) =>
    apiRequest<AttendanceSession>(`/api/attendance/sessions/${encodeURIComponent(id)}/close`, {
      method: "PATCH",
    }),
  markAttendance: (sessionId: string, qrToken: string) =>
    apiRequest<AttendanceSession>(`/api/attendance/sessions/${encodeURIComponent(sessionId)}/mark`, {
      method: "POST",
      body: JSON.stringify({ qrToken }),
    }),
  updateRecord: (sessionId: string, recordId: string, status: string) =>
    apiRequest<AttendanceSession>(
      `/api/attendance/sessions/${encodeURIComponent(sessionId)}/records/${encodeURIComponent(recordId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    ),
};
