import { apiRequest } from "./api";

export type DashboardStats = {
    totalStudents: number;
    studentsChange: string;
    activeCourses: number;
    coursesChange: string;
    pendingAdmissions: number;
    admissionsChange: string;
    feeCollection: number;
    feeCollectionChange: string;
};

export type DashboardActivity = {
    title: string;
    detail: string;
    time: string;
    tone: string;
};

export type DashboardSchedule = {
    time: string;
    period: string;
    title: string;
    detail: string;
    color: string;
};

export const dashboardApi = {
    stats: () => apiRequest<DashboardStats>("/api/dashboard/stats"),
    activity: () => apiRequest<DashboardActivity[]>("/api/dashboard/activity"),
    schedule: () => apiRequest<DashboardSchedule[]>("/api/dashboard/schedule"),
};
