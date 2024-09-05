import { GuideType } from "../../models/guide";
import GuideCard from "../../components/guideCard";

import { Grid } from "../style";

type Props = {
  fetchedGuides: (GuideType & { individualGuideLink: string })[];
};

const GuidesClient = ({ fetchedGuides }: Props) => {
  return (
    <Grid>
      <>
        {fetchedGuides.map((guide, index) => (
          <GuideCard
            forReturn={guide.individualGuideLink}
            key={guide.individualGuideLink}
            guideNr={index + 1}
            name={guide.title}
            status="Guide not Returned"
          />
        ))}
      </>
    </Grid>
  );
};

export default GuidesClient;
