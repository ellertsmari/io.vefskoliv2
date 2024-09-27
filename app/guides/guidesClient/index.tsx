import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";
import { ExtendedGuideInfo } from "../types";

type Props = {
  fetchedGuides: ExtendedGuideInfo[];
  useGuideOrder: boolean;
};

const GuidesClient = ({ fetchedGuides, useGuideOrder }: Props) => {
  console.log(fetchedGuides);
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
