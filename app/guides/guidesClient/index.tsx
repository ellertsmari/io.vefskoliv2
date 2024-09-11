import GuideCard from "../../components/guideCard";

import { GuideContainer } from "../style";
import { GuideInfoWithLink } from "../query";

type Props = {
  fetchedGuides: GuideInfoWithLink[];
};

const GuidesClient = ({ fetchedGuides }: Props) => {
  console.log(fetchedGuides);
  return (
    <GuideContainer>
      {fetchedGuides.map((guide, index) => {
        return <GuideCard guide={guide} key={index} />;
      })}
    </GuideContainer>
  );
};

export default GuidesClient;
