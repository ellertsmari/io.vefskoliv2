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
import { GuideInfoWithLink } from "../../guides/types";

const GuideCard = ({
  guide,
  order,
}: {
  guide: GuideInfoWithLink;
  order?: number;
}) => {
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
  return (
    <>
      <CardWrapper>
        <InfoWrapper>
          <StyledLink href={guide.link}>
            <Info>
              <GuideNr>
                {order ? `GUIDE ${order}` : `MODULE ${guide.module.title[0]}`}
              </GuideNr>
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
