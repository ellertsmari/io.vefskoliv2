import { getGuide } from "../../utils/serverActions";
import { GuideProvider } from "../../providers/GuideProvider";
import { Guide } from "./Guide";
import { GuideType } from "../../models/guide";

//displaying the guide here
const GuidePage = async ({ params }: { params: { id: string } }) => {
  const guideJSON = await getGuide(params.id);
  const guide: GuideType = JSON.parse(JSON.stringify(guideJSON));

  if (!guide) {
    return (
      <>
        <h1>Guide not found</h1>
        <h2>{params.id}</h2>
      </>
    );
  }

  return <Guide guide={guide} />;
};

export default GuidePage;
