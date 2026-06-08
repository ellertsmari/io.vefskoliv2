"use server";
import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { GuideOverview } from "../components/guideOverview/GuideOverview";
import { sanitizeGuideForClient } from "utils/exerciseUtils";
import { ClientGuide } from "types/guideTypes";
import { Session } from "next-auth";

type ParamsType = Promise<{ id: string }>;

const GuidePage = async ({ params }: { params: ParamsType }) => {
  const { id } = await params;
  const session: Session | null = await auth();
  const guideJSON = await getGuide(id);
  // Strip the exercise answer key before this reaches the client. This page is
  // the student/public view, so the raw `exercise` must never be serialized here.
  const guide: ClientGuide | null = guideJSON
    ? (sanitizeGuideForClient(
        JSON.parse(JSON.stringify(guideJSON))
      ) as unknown as ClientGuide)
    : null;

  if (!guide) {
    return (
      <>
        <h1>Guide not found</h1>
        <h2>{id}</h2>
      </>
    );
  }

  // Pass authentication status to determine if return form should be shown
  const isAuthenticated = !!session?.user?.id;

  return <GuideOverview guide={guide} isAuthenticated={isAuthenticated} />;
};

export default GuidePage;





