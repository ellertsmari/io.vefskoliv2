import { Paragraph, Heading1 } from "globalStyles/text";
import { useGuide } from "providers/GuideProvider";
import { ReviewStatus } from "types/guideTypes";
import { calculateReturnStyle } from "./calculateReturnStyle";
import { Button } from "globalStyles/buttons/default/style";
import { FeedbackOverview } from "../../../LMS/components/feedback/feedbackOverview/FeedbackOverview";
import { GiveFeedbackView } from "../../../LMS/components/feedback/giveFeedbackView/GiveFeedbackView";
import {
  ColouredCircle,
  Header,
  GuideModalWrapper,
  ReturnStatusContainer,
  TitleContainer,
} from "./style";
import { UnstyledLinkNoWrap } from "globalStyles/globalStyles";

export const GuideModal = () => {
  const { guide } = useGuide();
  if (!guide) return null;

  const { link, returnStatus, title, reviewStatus } = guide;

  const RenderedContent = () => {
    if (reviewStatus === ReviewStatus.NEED_TO_REVIEW) {
      return <GiveFeedbackView guideTitle={title} />;
    }
    return <FeedbackOverview />;
  };

  return (
    <GuideModalWrapper>
      <Header>
        <TitleContainer>
          <Heading1>{title}</Heading1>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ReturnStatusContainer>
              <ColouredCircle
                $backgroundColor={calculateReturnStyle(returnStatus)}
              />
              <Paragraph>{returnStatus}</Paragraph>
            </ReturnStatusContainer>
            <UnstyledLinkNoWrap href={link} target="_blank">
              <Button $styletype="outlined">VIEW THIS GUIDE</Button>
            </UnstyledLinkNoWrap>
          </div>
        </TitleContainer>
      </Header>
      <RenderedContent />
    </GuideModalWrapper>
  );
};
