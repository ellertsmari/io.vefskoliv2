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
} from "./style";
import { ExtendedGuideInfo } from "../../guides/types";

const GuideCard = ({
  guide,
  order,
}: {
  guide: ExtendedGuideInfo;
  order?: number;
}) => {
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
        <Modal
          modalTrigger={StatusContainer(guide.returnStatus.toString())}
          modalContent={ModalContent}
        />
      </CardWrapper>
    </>
  );
};

export default GuideCard;

const StatusContainer = (info: string) => {
  return (
    <StatusWrapper>
      <Status>{info}</Status>
    </StatusWrapper>
  );
};
