"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["STUDENT", "TEACHER"], { required_error: "Select a role." }),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "STUDENT" },
  });

  const selectedRole = watch("role");

  async function submitRegister(values: RegisterValues) {
    setError("");
    setLoading(true);
    try {
      const result = await authApi.register(values.name, values.email, values.password, values.role);
      router.replace(`/verify-email?email=${encodeURIComponent(result.email)}&role=${values.role}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account.",
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
          <h1>Create your account</h1>
          <p>
            Join Northstar University and access your personalized workspace.
          </p>
        </div>
        <div className="showcase-stat">
          <ShieldCheck size={18} />
          <span>
            <strong>Secure by design</strong>
            <small>Your account is protected with verified access.</small>
          </span>
        </div>
        <div className="showcase-benefits">
          <div className="benefit-item">
            <Sparkles size={18} />
            <span>Personalized dashboard for your role</span>
          </div>
          <div className="benefit-item">
            <CalendarDays size={18} />
            <span>Access schedules, grades & resources</span>
          </div>
          <div className="benefit-item">
            <ShieldCheck size={18} />
            <span>Secure authentication & privacy</span>
          </div>
        </div>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-heading">
            <p className="eyebrow">Sign up</p>
            <h2>Create your university account</h2>
            <p>Choose your role and enter your details to get started.</p>
          </div>
          <form onSubmit={handleSubmit(submitRegister)} className="auth-form">
            <label htmlFor="name">
              Full name
              <div className="input-wrap">
                <User size={17} />
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </label>
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
                  placeholder="Create a password"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
            <label htmlFor="role">
              Role
              <div className="input-wrap">
                <ShieldCheck size={17} />
                <select
                  id="role"
                  {...register("role")}
                  required
                  className="role-select"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>
              {errors.role && (
                <span className="field-error">{errors.role.message}</span>
              )}
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-footnote">
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </p>
        </div>
      </section>
    </main>
  );
}