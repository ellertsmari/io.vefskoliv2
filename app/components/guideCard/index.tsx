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

type GuideCardProps = {
  guideNr: number;
  name: string;
  status: string;
  forReturn: string;
};

const GuideCard = ({ guideNr, name, status, forReturn }: GuideCardProps) => {
  const ModalTrigger = (
    <StatusWrapper>
      <Review>
        <Status>{status}</Status>
      </Review>
    </StatusWrapper>
  );

  // todo: implement review modal
  const ModalContent = <div>PLACEHOLDER</div>;

  return (
    <>
      <CardWrapper>
        <InfoWrapper>
          <StyledLink href={forReturn}>
            <Info>
              <GuideNr>GUIDE {guideNr}</GuideNr>
              <Name>{name}</Name>
            </Info>
          </StyledLink>
        </InfoWrapper>
        <Modal modalTrigger={ModalTrigger} modalContent={ModalContent} />
      </CardWrapper>
    </>
  );
};

export default GuideCard;
