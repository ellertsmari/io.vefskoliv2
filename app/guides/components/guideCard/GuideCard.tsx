import Modal from "UIcomponents/modal/modal";
import {
  ExtendedGuideInfo,
  ReviewStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "types/guideTypes";
import { GuideProvider } from "providers/GuideProvider";
import { GuideCardOverview } from "../guideCardOverview/GuideCardOverview";
import { CardWrapper, InfoWrapper } from "./style";
import { NotificationIconContainer } from "UIcomponents/toggle/style";
import { NotificationIcon } from "assets/Icons";
import { Suspense, lazy } from "react";

const GuideModal = lazy(() =>
  import("../guideModal/GuideModal").then((mod) => ({
    default: mod.GuideModal,
  }))
);

const GuideCard = ({
  guide,
  order,
}: {
  guide: ExtendedGuideInfo;
  order?: number;
}) => {
  const { returnStatus, reviewStatus, gradesGivenStatus, grade } = guide;

  const link =
    guide.returnStatus === ReturnStatus.NOT_RETURNED ? guide.link : undefined;
  return (
    <GuideProvider guide={guide}>
      <CardWrapper>
        <InfoWrapper
          $borderStyle={calculateBorderStyle(
            returnStatus,
            reviewStatus,
            gradesGivenStatus
          )}
        >
          {link ? (
            <GuideCardOverview
              moduleTitle={guide.module.title[0]}
              guideTitle={guide.title}
              link={link}
              order={order}
              returnStatus={returnStatus}
              reviewStatus={reviewStatus}
              gradesGivenStatus={gradesGivenStatus}
              grade={grade}
            />
          ) : (
            <>
              {(reviewStatus === ReviewStatus.NEED_TO_REVIEW ||
                gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE) && (
                <Notification />
              )}
              <Modal
                modalTrigger={
                  <GuideCardOverview
                    moduleTitle={guide.module.title[0]}
                    guideTitle={guide.title}
                    order={order}
                    returnStatus={returnStatus}
                    reviewStatus={reviewStatus}
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
    <NotificationIconContainer>
      <NotificationIcon />
    </NotificationIconContainer>
  );
};

const calculateBorderStyle = (
  returnStatus: ReturnStatus,
  reviewStatus: ReviewStatus,
  gradesGivenStatus: GradesGivenStatus
) => {
  if (returnStatus === ReturnStatus.NOT_RETURNED) {
    return undefined;
  }

  if (
    reviewStatus === ReviewStatus.NEED_TO_REVIEW ||
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
    return "border-color: var(--theme-module3-100); background-color: var(--theme-module3-10); border-width: 3px;";
  }
};

export default GuideCard;
