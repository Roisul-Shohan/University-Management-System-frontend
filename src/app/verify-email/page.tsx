"use client";

import {
  ArrowRight,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api";

const verifySchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code."),
});

type VerifyValues = z.infer<typeof verifySchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const role = searchParams.get("role") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  async function submitVerify(values: VerifyValues) {
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail(email, values.otp);
      router.replace("/login");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Invalid or expired code.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendLoading(true);
    try {
      await authApi.resendOtp(email);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to resend code.",
      );
    } finally {
      setResendLoading(false);
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
          <p className="auth-kicker">Verify your email</p>
          <h1>Check your inbox</h1>
          <p>
            We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Enter it below to complete your registration.
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
            <p className="eyebrow">Enter code</p>
            <h2>Verification code</h2>
            <p>The code expires in 4 minutes.</p>
          </div>
          <form onSubmit={handleSubmit(submitVerify)} className="auth-form">
            <label htmlFor="otp">
              6-digit code
              <div className="input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="otp"
                  type="text"
                  {...register("otp")}
                  placeholder="123456"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              {errors.otp && (
                <span className="field-error">{errors.otp.message}</span>
              )}
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify email"}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-footnote">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              className="text-button"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend code"}
            </button>
          </p>
          <p className="auth-footnote">
            <AlertCircle size={14} /> Code not working? Request a new one or{" "}
            <a href="/register">start over</a>
          </p>
        </div>
      </section>
    </main>
  );
}