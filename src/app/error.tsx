"use client";

import { useEffect } from "react";
import { RouteError } from "./_components/route-feedback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root route failed", error);
  }, [error]);

  return <RouteError error={error} reset={reset} />;
}