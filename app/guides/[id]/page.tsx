"use server";
import { auth } from "../../../auth";
import { getGuide } from "serverActions/getGuide";
import { GuideOverview } from "../components/guideOverview/GuideOverview";
import { ClientGuide } from "types/guideTypes";
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





