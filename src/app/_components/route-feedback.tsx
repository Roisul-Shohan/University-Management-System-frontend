"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

export function RouteLoading({
  label = "Loading workspace...",
}: {
  label?: string;
}) {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-mark" aria-hidden="true">
        <LoaderCircle size={22} className="route-spinner" />
      </div>
      <p>{label}</p>
    </main>
  );
}

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="loading-screen route-error" role="alert">
      <div className="loading-mark route-error-mark" aria-hidden="true">
        <AlertTriangle size={22} />
      </div>
      <h1>Something went wrong</h1>
      <p>{error.message || "This page could not be loaded."}</p>
      <button className="submit-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
