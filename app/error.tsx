"use client";

import { useEffect } from "react";
import { ErrorState } from "UIcomponents/errorState/ErrorState";
import { RetryButton } from "UIcomponents/errorState/RetryButton";
import { LinkButton } from "UIcomponents/errorState/style";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
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
