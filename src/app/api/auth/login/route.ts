import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function attemptLogin(email: string, password: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return {
      success: false as const,
      message: body.message ?? "Unable to sign in.",
    };
  }

  const body = (await res.json()) as {
    user: { role: string };
    accessToken?: string;
  };

  const cookieStore = await cookies();
  cookieStore.set("accessToken", body.accessToken ?? "", {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  cookieStore.set("northstar-session", "active", {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  cookieStore.set("northstar-role", body.user.role, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return { success: true as const };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";
  const password = searchParams.get("password") ?? "";

  if (!email || !password) {
    return Response.redirect(new URL("/login", request.url), 302);
  }

  const result = await attemptLogin(email, password);

  if (result.success) {
    return Response.redirect(new URL("/", request.url), 302);
  }

  return Response.redirect(
    new URL(`/login?error=${encodeURIComponent(result.message)}`, request.url),
    302,
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = body.email ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return Response.json({ message: "Email and password are required." }, { status: 400 });
  }

  const result = await attemptLogin(email, password);

  if (!result.success) {
    return Response.json({ message: result.message }, { status: 401 });
  }

  return Response.json({ success: true }, { status: 200 });
}
