import { SmallText, Title } from "globalStyles/text";
import { useGuide } from "../../providers/GuideProvider";
import {
  ColouredCircle,
  ReturnStatus,
  Header,
  TitleContainer,
  ModalWrapper,
  LinkNoWrap,
} from "./style";
import { ExtendedGuideInfo } from "../../guides/types";
import { calculateReturnStyle } from "./utils";
import { Button } from "globalStyles/buttons/default/style";
import { FeedbackOverview } from "./FeedbackOverview";

export const GuideModal = () => {
  const { link, returnStatus, title } = useGuide() as ExtendedGuideInfo;

  return (
    <ModalWrapper>
      <Header>
        <TitleContainer>
          <Title>{title}</Title>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <ReturnStatus>
              <ColouredCircle
                $backgroundColor={calculateReturnStyle(returnStatus)}
              />
              <SmallText>{returnStatus}</SmallText>
            </ReturnStatus>
            <LinkNoWrap href={link} target="_blank">
              <Button $styletype="outlined">VIEW THIS GUIDE</Button>
            </LinkNoWrap>
          </div>
        </TitleContainer>
      </Header>
      <FeedbackOverview />
    </ModalWrapper>
  );
};
