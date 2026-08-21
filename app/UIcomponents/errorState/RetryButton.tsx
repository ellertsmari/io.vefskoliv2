"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import DefaultButton from "globalStyles/buttons/default";

type Props = {
  /**
   * An error boundary's `reset`. Omitted on pages without a boundary (a 404),
   * where re-fetching the route is all there is to retry.
   */
  onRetry?: () => void;
  label?: string;
};

export const RetryButton = ({ onRetry, label = "TRY AGAIN" }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DefaultButton
      style="default"
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          // refresh() re-runs the server render; reset() clears the boundary so
          // the fresh result is actually displayed.
          router.refresh();
          onRetry?.();
        })
      }
    >
      {isPending ? "REFRESHING…" : label}
    </DefaultButton>
  );
};

export default RetryButton;
