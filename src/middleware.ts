import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/login"]);
const roleRules: Record<string, string[]> = {
  "/academic-periods": ["SUPER_ADMIN"],
  "/departments": ["SUPER_ADMIN"],
  "/students": ["SUPER_ADMIN"],
  "/course-offerings": ["SUPER_ADMIN", "TEACHER"],
  "/courses": ["SUPER_ADMIN", "TEACHER"],
  "/programs": ["SUPER_ADMIN", "TEACHER"],
  "/curriculum-courses": ["SUPER_ADMIN", "TEACHER"],
  "/payments": ["STUDENT"],
  "/admissions": ["STUDENT"],
  "/admission-review": ["SUPER_ADMIN", "TEACHER"],
  "/semester-registration": ["STUDENT"],
  "/course-registration": ["STUDENT"],
  "/exams": ["STUDENT"],
  "/exam-management": ["SUPER_ADMIN", "TEACHER"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!request.cookies.has("northstar-session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = Object.entries(roleRules).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  )?.[1];
  const role = request.cookies.get("northstar-role")?.value;

  if (requiredRoles && (!role || !requiredRoles.includes(role))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
