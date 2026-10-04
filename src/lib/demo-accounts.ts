export const demoAccounts = [
  {
    role: "SUPER_ADMIN",
    label: "Admin demo",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "",
  },
  {
    role: "TEACHER",
    label: "Teacher demo",
    email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL ?? "",
    password: process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD ?? "",
  },
  {
    role: "STUDENT",
    label: "Student demo",
    email: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL ?? "",
    password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD ?? "",
  },
] as const;
