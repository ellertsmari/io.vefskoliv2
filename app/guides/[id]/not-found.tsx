import { ErrorState } from "UIcomponents/states/States";

/** Shown with a 404 status when a guide id doesn't exist. */
export default function GuideNotFound() {
  return (
    <ErrorState
      title="Guide not found"
      message="This guide may have been moved or removed."
      backLink="/guides"
    />
  );
}
