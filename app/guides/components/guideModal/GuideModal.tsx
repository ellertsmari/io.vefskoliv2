import { Paragraph, Heading1 } from "globalStyles/text";
import { useGuide } from "providers/GuideProvider";
import { ReviewStatus, GradingMode } from "types/guideTypes";
import { calculateReturnStyle } from "./calculateReturnStyle";
import { Button } from "globalStyles/buttons/default/style";
import { FeedbackOverview } from "../feedback/feedbackOverview/FeedbackOverview";
import { GiveFeedbackView } from "../feedback/giveFeedbackView/GiveFeedbackView";
import {
  ColouredCircle,
  Header,
  GuideModalWrapper,
  ReturnStatusContainer,
  StatusRow,
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
          <StatusRow>
            <ReturnStatusContainer>
              <ColouredCircle
                $backgroundColor={calculateReturnStyle(returnStatus)}
              />
              <Paragraph>{returnStatus}</Paragraph>
            </ReturnStatusContainer>
            <UnstyledLinkNoWrap href={link} target="_blank">
              <Button $styletype="outlined">VIEW THIS GUIDE</Button>
            </UnstyledLinkNoWrap>
          </StatusRow>
        </TitleContainer>
      </Header>
      {guide.submissionType === "activityLog" ? <Paragraph>Open the activity log to see semester progress, record hours, or review activities.</Paragraph> : guide.gradingMode === GradingMode.AUTO ? (
        // Auto-graded guides have no peer feedback; point the student back to
        // the exercise, which never closes.
        <Paragraph>
          This is an auto-graded exercise
          {grade !== undefined ? ` (score ${grade}/10)` : ""}. Open the guide to
          see your answers and carry on where you left off.
        </Paragraph>
      ) : reviewStatus === ReviewStatus.NEED_TO_REVIEW ? (
        // Keyed on the return being reviewed: after "CONTINUE" refreshes the
        // data, the next return must get a fresh form, not the previous
        // form's "submitted" state.
        <GiveFeedbackView
          key={String(guide.availableForReview[0]?._id ?? "none")}
          guideTitle={title}
        />
      ) : (
        <FeedbackOverview />
      )}
    </GuideModalWrapper>
  );
};
