import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";
import { GuideInfoWithLink } from "../types";

type Props = {
  fetchedGuides: GuideInfoWithLink[];
};

const GuidesClient = ({ fetchedGuides }: Props) => {
  return (
    <GuideContainer>
      {fetchedGuides.map((guide, index) => {
        return <GuideCard guide={guide} key={index} />;
      })}
    </GuideContainer>
  );
};

export default GuidesClient;
