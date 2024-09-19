import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";
import { GuideInfoWithLink } from "../types";

type Props = {
  fetchedGuides: GuideInfoWithLink[];
  useGuideOrder: boolean;
};

const GuidesClient = ({ fetchedGuides, useGuideOrder }: Props) => {
  return (
    <GuideContainer>
      {fetchedGuides.map((guide, index) => {
        return (
          <GuideCard
            guide={guide}
            key={index}
            order={useGuideOrder ? index + 1 : undefined}
          />
        );
      })}
    </GuideContainer>
  );
};

export default GuidesClient;
