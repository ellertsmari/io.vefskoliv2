import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { GuideOverview } from "../components/guideOverview/GuideOverview";
import { ClientGuide, GradingMode } from "types/guideTypes";
import { getExerciseSummary } from "serverActions/exerciseSession";
import { ErrorState } from "UIcomponents/states/States";
import { Session } from "next-auth";

type ParamsType = Promise<{ id: string }>;

const GuidePage = async ({ params }: { params: ParamsType }) => {
  const { id } = await params;
  const session: Session | null = await auth();
  // getGuide is sanitized by default: the exercise answer key is stripped
  // server-side and the result is already client-serializable.
  const guide: ClientGuide | null = await getGuide(id);

  if (!guide) {
    return (
      <ErrorState
        title="Guide not found"
        message="This guide may have been moved or removed."
        backLink="/guides"
      />
    );
  }

  // Pass authentication status to determine if return form should be shown
  const isAuthenticated = !!session?.user?.id;

  // Where the student stands, so the guide can show a button rather than the
  // whole exercise: not started, part way through, finished, or perfect.
  const exerciseSummary =
    isAuthenticated && guide.gradingMode === GradingMode.AUTO
      ? (await getExerciseSummary(id)) ?? undefined
      : undefined;

  return (
    <GuideOverview
      guide={guide}
      isAuthenticated={isAuthenticated}
      exerciseSummary={exerciseSummary}
    />
  );
};

export default GuidePage;





