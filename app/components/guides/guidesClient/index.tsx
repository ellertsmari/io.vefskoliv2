import GuideCard from "../../guideCard/GuideCard";

import { GuideContainer } from "../style";
import { ExtendedGuideInfo } from "types/guideTypes";

type GuidesClientProps = {
  guides: ExtendedGuideInfo[];
  useGuideOrder: boolean;
};
const GuidesClient = ({ guides, useGuideOrder }: GuidesClientProps) => {
  return (
    <GuideContainer>
      {guides.map((guide, index) => {
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
