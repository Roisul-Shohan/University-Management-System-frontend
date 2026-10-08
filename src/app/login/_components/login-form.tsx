"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api";
import { demoAccounts } from "@/lib/demo-accounts";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {};

export default function LoginForm({}: LoginFormProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const serverError = urlSearchParams.get("error") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (serverError) {
      setError(serverError);
    }
  }, [serverError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function submitLogin(values: LoginValues) {
    setError("");
    setLoading(true);
    try {
      await authApi.login(values.email, values.password);
      router.replace("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string, demoPassword: string) {
    if (!demoEmail || !demoPassword) {
      setError("Demo credentials are not configured for this environment.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authApi.login(demoEmail, demoPassword);
      router.replace("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in with the demo account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <div className="auth-brand">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>
          <div>
            <strong>Northstar</strong>
            <span>University</span>
          </div>
        </div>
        <div className="showcase-copy">
          <p className="auth-kicker">One connected campus</p>
          <h1>Bring every part of university life into focus.</h1>
          <p>
            Manage people, programs, payments, and progress from one calm,
            thoughtful workspace.
          </p>
        </div>
        <div className="showcase-stat">
          <ShieldCheck size={18} />
          <span>
            <strong>Secure by design</strong>
            <small>Your account is protected with verified access.</small>
          </span>
        </div>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your workspace</h2>
            <p>Use your university account to continue.</p>
          </div>
          <form onSubmit={handleSubmit(submitLogin)} className="auth-form">
            <label htmlFor="email">
              Email address
              <div className="input-wrap">
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="you@northstar.edu"
                  required
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <span className="field-error">{errors.email.message}</span>
              )}
            </label>
            <label htmlFor="password">
              Password
              <div className="input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  {errors.password && (
                    <span className="field-error">
                      {errors.password.message}
                    </span>
                  )}
                </button>
              </div>
            </label>
            <div className="form-options">
              <label className="remember">
                <input type="checkbox" /> <span>Remember me</span>
              </label>
              <button type="button" className="text-button">
                Forgot password?
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <div className="demo-login" aria-label="Demo login accounts">
            <p className="demo-login-title">Try a demo workspace</p>
            <div className="demo-login-grid">
              {demoAccounts.map((account) => (
                <button
                  className="demo-login-button"
                  key={account.role}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleDemoLogin(account.email, account.password)
                  }
                >
                  <strong>{account.label}</strong>
                  <span>{account.role.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="auth-footnote">
            Need an account? <span>Contact your administrator</span>
          </p>
        </div>
      </section>
    </main>
  );
}
