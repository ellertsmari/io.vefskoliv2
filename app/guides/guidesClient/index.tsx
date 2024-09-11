import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";
import { GuideInfoWithLink } from "../query";

type Props = {
  fetchedGuides: GuideInfoWithLink[];
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
