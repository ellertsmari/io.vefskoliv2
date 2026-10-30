import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { getReturnSummary } from "serverActions/getReturnSummary";
import { GuideOverview, type GuideViewer } from "../components/guideOverview/GuideOverview";
import { ClientGuide, GradingMode } from "types/guideTypes";
import { getExerciseSummary } from "serverActions/exerciseSession";
import { isActingAsTeacher } from "utils/userUtils";
import { Session } from "next-auth";
import { getActivityLog } from "serverActions/activityLog";
import { ActivityLogView } from "../components/activityLog/ActivityLogView";
import { guidePageTitle, isDraftGuide, plainExcerpt } from "utils/guideSeo";
import { SITE_NAME } from "constants/site";

type ParamsType = Promise<{ id: string }>;

// getGuide is sanitized by default: the exercise answer key is stripped
// server-side and the result is already client-serializable. Cached per
// request, so the metadata and the page share one database read.
const loadGuide = cache(
  async (id: string): Promise<ClientGuide | null> => getGuide(id)
);

/**
 * One title, description and canonical address per guide, so a search result
 * or a shared link says which guide it is. Every guide used to share the
 * section's "Guides - Vefskólinn LMS".
 */
export async function generateMetadata({
  params,
}: {
  params: ParamsType;
}): Promise<Metadata> {
  const { id } = await params;
  const guide = await loadGuide(id);
  if (!guide) return { title: `Guide not found · ${SITE_NAME}` };

  const title = guidePageTitle(guide);
  const description = plainExcerpt(guide.description ?? "") || undefined;
  const url = `/guides/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: SITE_NAME },
    ...(isDraftGuide(guide) ? { robots: { index: false } } : {}),
  };
}

const GuidePage = async ({ params }: { params: ParamsType }) => {
  const { id } = await params;
  const session: Session | null = await auth();
  const guide = await loadGuide(id);

  // A real 404, not a "not found" message on a 200 page, which search
  // engines would index as a guide. Nothing above this streams, so the
  // status is still ours to set.
  if (!guide) notFound();

  // A teacher viewing as a student is a student here, like everywhere else.
  const viewer: GuideViewer = !session?.user?.id
    ? "guest"
    : isActingAsTeacher(session)
      ? "teacher"
      : "student";
  if (guide.submissionType === "activityLog" && viewer !== "guest") {
    return <ActivityLogView key={`${id}-${session?.user?.id}`} guideId={id} title={guide.title} description={guide.description} guideDetails={guide} initial={await getActivityLog(id)} />;
  }
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
