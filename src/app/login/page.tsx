"use client";

import { ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.login(email.trim(), password);
      router.replace("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <div className="auth-brand"><div className="brand-mark"><GraduationCap size={22} /></div><div><strong>Northstar</strong><span>University</span></div></div>
        <div className="showcase-copy"><p className="auth-kicker">One connected campus</p><h1>Bring every part of university life into focus.</h1><p>Manage people, programs, payments, and progress from one calm, thoughtful workspace.</p></div>
        <div className="showcase-stat"><ShieldCheck size={18} /><span><strong>Secure by design</strong><small>Your account is protected with verified access.</small></span></div>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-heading"><p className="eyebrow">Welcome back</p><h2>Sign in to your workspace</h2><p>Use your university account to continue.</p></div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email address<div className="input-wrap"><Mail size={17} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@northstar.edu" required autoComplete="email" /></div></label>
            <label htmlFor="password">Password<div className="input-wrap"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required minLength={6} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <div className="form-options"><label className="remember"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="text-button">Forgot password?</button></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="submit-button" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-footnote">Need an account? <span>Contact your administrator</span></p>
        </div>
      </section>
    </main>
  );
}
