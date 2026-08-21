import { ErrorState } from "UIcomponents/errorState/ErrorState";
import { RetryButton } from "UIcomponents/errorState/RetryButton";
import { LinkButton } from "UIcomponents/errorState/style";

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Page not found"
      message="This page doesn't exist, or it may have moved. Check the address, or head back and find it from the menu."
    >
      <RetryButton label="REFRESH" />
      <LinkButton href="/LMS/dashboard">BACK TO HOME</LinkButton>
    </ErrorState>
  );
}
