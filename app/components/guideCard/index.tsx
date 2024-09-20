import Modal from "components/modal/modal";
import { ExtendedGuideInfo, ReturnStatus } from "../../guides/types";
import { GuideProvider } from "../../providers/GuideProvider";
import { Card } from "./Card";
import { CardWrapper, InfoWrapper } from "./style";
import { GuideModal } from "./GuideModal";

const GuideCard = ({
  guide,
  order,
}: {
  guide: ExtendedGuideInfo;
  order?: number;
}) => {
  const link =
    guide.returnStatus === ReturnStatus.NOT_RETURNED ? guide.link : undefined;

  return (
    <GuideProvider guide={guide}>
      <CardWrapper>
        <InfoWrapper>
          {link ? (
            <Card
              moduleTitle={guide.module.title[0]}
              guideTitle={guide.title}
              link={link}
              order={order}
            />
          ) : (
            <Modal
              modalTrigger={
                <Card
                  moduleTitle={guide.module.title[0]}
                  guideTitle={guide.title}
                  order={order}
                />
              }
              modalContent={<GuideModal />}
            />
          )}
        </InfoWrapper>
      </CardWrapper>
    </GuideProvider>
  );
};

export default GuideCard;
