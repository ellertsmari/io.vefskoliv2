import { SmallText, Title } from "globalStyles/text";
import { useGuide } from "../../providers/GuideProvider";
import {
  ColouredCircle,
  ReturnStatusContainer,
  Header,
  TitleContainer,
  ModalWrapper,
  LinkNoWrap,
} from "./style";
import { FeedbackStatus } from "../../../types/guideTypes";
import { calculateReturnStyle } from "./utils";
import { Button } from "globalStyles/buttons/default/style";
import { FeedbackOverview } from "./FeedbackOverview";
import { GiveFeedbackView } from "./GiveFeedbackView";

export const GuideModal = () => {
  const { guide } = useGuide();
  if (!guide) return null;

  const { link, returnStatus, title, feedbackStatus } = guide;

  const RenderedContent = () => {
    if (feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK) {
      return <GiveFeedbackView guideTitle={title} />;
    }
    return <FeedbackOverview />;
  };

  return (
    <ModalWrapper>
      <Header>
        <TitleContainer>
          <Title>{title}</Title>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ReturnStatusContainer>
              <ColouredCircle
                $backgroundColor={calculateReturnStyle(returnStatus)}
              />
              <SmallText>{returnStatus}</SmallText>
            </ReturnStatusContainer>
            <LinkNoWrap href={link} target="_blank">
              <Button $styletype="outlined">VIEW THIS GUIDE</Button>
            </LinkNoWrap>
          </div>
        </TitleContainer>
      </Header>
      <RenderedContent />
    </ModalWrapper>
  );
};
