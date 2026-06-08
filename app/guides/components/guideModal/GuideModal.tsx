import { Paragraph, Heading1 } from "globalStyles/text";
import { useGuide } from "providers/GuideProvider";
import { ReviewStatus, GradingMode } from "types/guideTypes";
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

  const { link, returnStatus, title, reviewStatus, grade } = guide;

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
      {guide.gradingMode === GradingMode.AUTO ? (
        // Auto-graded guides have no peer feedback; point the student back to
        // the exercise to review their result or try again.
        <Paragraph>
          This is an auto-graded exercise
          {grade !== undefined ? ` (score ${grade}/10)` : ""}. Open the guide to
          review your answers or try again.
        </Paragraph>
      ) : reviewStatus === ReviewStatus.NEED_TO_REVIEW ? (
        <GiveFeedbackView guideTitle={title} />
      ) : (
        <FeedbackOverview />
      )}
    </GuideModalWrapper>
  );
};
