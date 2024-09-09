import { GuideType } from "../../models/guide";
import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";

type Props = {
  fetchedGuides: (GuideType & { individualGuideLink: string })[];
};

const GuidesClient = ({ fetchedGuides }: Props) => {
  return (
    <GuideContainer>
      {fetchedGuides.map((guide, index) => (
        <GuideCard
          forReturn={guide.individualGuideLink}
          key={guide.individualGuideLink}
          guideNr={index + 1}
          name={guide.title}
          status="Guide not Returned"
        />
      ))}
    </GuideContainer>
  );
};

export default GuidesClient;
