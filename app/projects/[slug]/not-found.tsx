import { ErrorState } from "UIcomponents/states/States";

/** Shown with a 404 status for an unknown or unpublished brief. */
export default function BriefNotFound() {
  return (
    <ErrorState
      title="Project not found"
      message="This project brief isn't published, or its address has changed."
      backLink="/projects"
    />
  );
}
