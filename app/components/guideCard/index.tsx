import Modal from "components/modal/modal";
import {
  ExtendedGuideInfo,
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../guides/types";
import { GuideProvider } from "../../providers/GuideProvider";
import { Card } from "./Card";
import { CardWrapper, InfoWrapper } from "./style";
import { NotificationIconContainer } from "components/toggle/style";
import { NotificationIcon } from "../../assets/NotificationIcon";
import { Suspense, lazy } from "react";

const GuideModal = lazy(() =>
  import("./GuideModal").then((mod) => ({ default: mod.GuideModal }))
);

const GuideCard = ({
  guide,
  order,
}: {
  guide: ExtendedGuideInfo;
  order?: number;
}) => {
  const { returnStatus, feedbackStatus, gradesGivenStatus, grade } = guide;

  const link =
    guide.returnStatus === ReturnStatus.NOT_RETURNED ? guide.link : undefined;

  return (
    <GuideProvider guide={guide}>
      <CardWrapper>
        <InfoWrapper
          $borderStyle={calculateBorderStyle(
            returnStatus,
            feedbackStatus,
            gradesGivenStatus
          )}
        >
          {link ? (
            <Card
              moduleTitle={guide.module.title[0]}
              guideTitle={guide.title}
              link={link}
              order={order}
              returnStatus={returnStatus}
              feedbackStatus={feedbackStatus}
              gradesGivenStatus={gradesGivenStatus}
              grade={grade}
            />
          ) : (
            <>
              {(feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK ||
                gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE) && (
                <Notification />
              )}
              <Modal
                modalTrigger={
                  <Card
                    moduleTitle={guide.module.title[0]}
                    guideTitle={guide.title}
                    order={order}
                    returnStatus={returnStatus}
                    feedbackStatus={feedbackStatus}
                    gradesGivenStatus={gradesGivenStatus}
                    grade={grade}
                  />
                }
                modalContent={
                  <Suspense fallback={<div>loading</div>}>
                    <GuideModal />
                  </Suspense>
                }
              />
            </>
          )}
        </InfoWrapper>
      </CardWrapper>
    </GuideProvider>
  );
};

const Notification = () => {
  return (
    <>
      <NotificationIconContainer aria-label={`Notification icon`}>
        <NotificationIcon />
      </NotificationIconContainer>
    </>
  );
};

const calculateBorderStyle = (
  returnStatus: ReturnStatus,
  feedbackStatus: FeedbackStatus,
  gradesGivenStatus: GradesGivenStatus
) => {
  if (returnStatus === ReturnStatus.NOT_RETURNED) {
    return undefined;
  }

  if (
    feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK ||
    gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE
  ) {
    return "border-color: var(--error-warning-100);";
  }
  if (returnStatus === ReturnStatus.PASSED) {
    return "border-color: var(--error-success-100); background-color: var(--error-success-10)";
  }
  if (returnStatus === ReturnStatus.FAILED) {
    return "border-color: var(--error-failure-100); background-color: var(--error-failure-10)";
  }
  if (returnStatus === ReturnStatus.HALL_OF_FAME) {
    return "background-color: var(--theme-module3-10); border-width: 3px;";
  }
};

export default GuideCard;
