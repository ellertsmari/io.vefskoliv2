"use client";

import Modal from "components/modal/modal";
import {
  CardWrapper,
  Info,
  Name,
  GuideNr,
  Status,
  StatusWrapper,
  StyledLink,
  InfoWrapper,
  Review,
} from "./style";
import { GuideInfoWithLink } from "../../guides/query";

const GuideCard = ({ guide }: { guide: GuideInfoWithLink }) => {
  const ModalTrigger = (
    <StatusWrapper>
      <Review>
        <Status>
          {guide.returnsSubmitted ? "Guide returned" : "Guide not returned"}
        </Status>
      </Review>
    </StatusWrapper>
  );

  // todo: implement review modal
  const ModalContent = <div>PLACEHOLDER</div>;
  console.log(guide);
  return (
    <>
      <CardWrapper>
        <InfoWrapper>
          <StyledLink href={guide.individualGuideLink}>
            <Info>
              <GuideNr>{`GUIDE ${guide.order}`}</GuideNr>
              <Name>{guide.title}</Name>
            </Info>
          </StyledLink>
        </InfoWrapper>
        <Modal modalTrigger={ModalTrigger} modalContent={ModalContent} />
      </CardWrapper>
    </>
  );
};

export default GuideCard;
