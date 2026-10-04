"use client";

import { useEffect } from "react";

export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Payments route failed", error);
  }, [error]);

  return (
    <main className="loading-screen">
      <p role="alert">We couldn&apos;t load the payment workspace.</p>
      <button className="submit-button" onClick={reset}>Try again</button>
    </main>
  );
}
