import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/login"]);

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};