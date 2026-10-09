export const demoAccounts = [
  {
    role: "SUPER_ADMIN",
    label: "Admin demo",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "university@gmail.com",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "aaaaaaaa",
  },
  {
    role: "TEACHER",
    label: "Teacher demo",
    email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL ?? "roisul192@gmail.com",
    password: process.env.NEXT_PUBLIC_DEMO_TEACHER_PASSWORD ?? "aaaaaa",
  },
  {
    role: "STUDENT",
    label: "Student demo",
    email: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL ?? "raychabegum@gmail.com",
    password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD ?? "aaaaaa",
  },
] as const;
