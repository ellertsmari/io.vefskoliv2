import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { getReturnSummary } from "serverActions/getReturnSummary";
import { GuideOverview, type GuideViewer } from "../components/guideOverview/GuideOverview";
import { ClientGuide, GradingMode } from "types/guideTypes";
import { getExerciseSummary } from "serverActions/exerciseSession";
import { ErrorState } from "UIcomponents/states/States";
import { isActingAsTeacher } from "utils/userUtils";
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

  // A teacher viewing as a student is a student here, like everywhere else.
  const viewer: GuideViewer = !session?.user?.id
    ? "guest"
    : isActingAsTeacher(session)
      ? "teacher"
      : "student";
  const isAuto = guide.gradingMode === GradingMode.AUTO;

  // Where the student stands, so the guide can lead with that rather than
  // with an empty form: exercise progress for auto-graded guides, the
  // latest return for peer-reviewed ones.
  const [exerciseSummary, returnSummary] = await Promise.all([
    viewer === "student" && isAuto
      ? getExerciseSummary(id).then((summary) => summary ?? undefined)
      : Promise.resolve(undefined),
    viewer === "student" && !isAuto ? getReturnSummary(id) : Promise.resolve(null),
  ]);

  return (
    <GuideOverview
      guide={guide}
      viewer={viewer}
      exerciseSummary={exerciseSummary}
      returnSummary={returnSummary}
    />
  );
};

export default GuidePage;
