"use server";
import { getGuide } from "serverActions/getGuide";
import { GuideOverview } from "components/guideOverview/GuideOverview";
import { GuideType } from "models/guide";

const GuidePage = async ({ params }) => {
  const { id } = await params;
  const guideJSON = await getGuide(id);
  const guide: GuideType = JSON.parse(JSON.stringify(guideJSON));

  if (!guide) {
    return (
      <>
        <h1>Guide not found</h1>
        <h2>{id}</h2>
      </>
    );
  }

  return <GuideOverview guide={guide} />;
};

export default GuidePage;
