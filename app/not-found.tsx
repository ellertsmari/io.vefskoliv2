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
      {/* "/" sends a signed-in user on to the dashboard and shows a guest
          the landing page; "/LMS/dashboard" bounced guests to sign-in. */}
      <LinkButton href="/">BACK TO HOME</LinkButton>
    </ErrorState>
  );
}
