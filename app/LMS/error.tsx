"use client";

import { useEffect } from "react";
import { ErrorState } from "UIcomponents/errorState/ErrorState";
import { RetryButton } from "UIcomponents/errorState/RetryButton";
import { LinkButton } from "UIcomponents/errorState/style";

/**
 * Boundary for the LMS section. Keeps one failing data fetch from replacing
 * the whole page — including the parts that had nothing to do with it.
 */
export default function LMSError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LMS page error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message="This page couldn't be loaded. It's usually temporary — try again, and let a teacher know if it keeps happening."
      digest={error.digest}
    >
      <RetryButton onRetry={reset} />
      <LinkButton href="/LMS/dashboard">BACK TO HOME</LinkButton>
    </ErrorState>
  );
}
