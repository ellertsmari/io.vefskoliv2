"use server";
import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { GuideOverview } from "../components/guideOverview/GuideOverview";
import { ClientGuide, GradingMode } from "types/guideTypes";
import { getBestExerciseAttempt } from "serverActions/getExerciseAttempts";
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

  // "Your best so far" context for students revisiting an auto-graded exercise.
  const bestAttempt =
    isAuthenticated && guide.gradingMode === GradingMode.AUTO
      ? (await getBestExerciseAttempt(id)) ?? undefined
      : undefined;

  return (
    <GuideOverview
      guide={guide}
      isAuthenticated={isAuthenticated}
      bestAttempt={bestAttempt}
    />
  );
};

export default GuidePage;





