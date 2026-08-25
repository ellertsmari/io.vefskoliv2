import Modal from "UIcomponents/modal/modal";
import {
  ExtendedGuideInfo,
  ReviewStatus,
  ReturnStatus,
} from "types/guideTypes";
import { GuideProvider } from "providers/GuideProvider";
import { extractModuleNumber } from "utils/moduleUtils";
import { GuideCardOverview } from "../guideCardOverview/GuideCardOverview";
import { CardWrapper, InfoWrapper } from "./style";
import { NotificationIconContainer } from "UIcomponents/toggle/style";
import { NotificationIcon } from "assets/Icons";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "UIcomponents/states/States";

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
  const { returnStatus, reviewStatus, grade } = guide;

  const link =
    guide.returnStatus === ReturnStatus.NOT_RETURNED ? guide.link : undefined;
  return (
    <GuideProvider guide={guide}>
      <CardWrapper>
        <InfoWrapper
          $borderStyle={calculateBorderStyle(
            returnStatus,
            reviewStatus
          )}
        >
          {link ? (
            <GuideCardOverview
              moduleTitle={extractModuleNumber(guide.module.title).toString()}
              guideTitle={guide.title}
              link={link}
              order={order}
              returnStatus={returnStatus}
              reviewStatus={reviewStatus}
              grade={grade}
            />
          ) : (
            <>
              {reviewStatus === ReviewStatus.NEED_TO_REVIEW && (
                <Notification />
              )}
              <Modal
                size="xl"
                modalTrigger={
                  <GuideCardOverview
                    moduleTitle={extractModuleNumber(guide.module.title).toString()}
                    guideTitle={guide.title}
                    order={order}
                    returnStatus={returnStatus}
                    reviewStatus={reviewStatus}
                    grade={grade}
                  />
                }
                modalContent={
                  <Suspense fallback={<LoadingSpinner label="Opening guide…" />}>
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
  reviewStatus: ReviewStatus
) => {
  if (returnStatus === ReturnStatus.NOT_RETURNED) {
    return undefined;
  }

  if (reviewStatus === ReviewStatus.NEED_TO_REVIEW) {
    return "border-color: var(--error-warning-100);";
  }
  if (returnStatus === ReturnStatus.PASSED) {
    return "border-color: var(--error-success-100); background-color: var(--error-success-10)";
  }
  if (returnStatus === ReturnStatus.FAILED) {
    return "border-color: var(--error-failure-100); background-color: var(--error-failure-10)";
  }
  if (returnStatus === ReturnStatus.HALL_OF_FAME) {
    // Thickened with an inset shadow rather than border-width: with border-box
    // a 3px border eats 4px of content width, so these cards laid out their
    // text 2px narrower than the cards beside them.
    return "border-color: var(--theme-module3-100); background-color: var(--theme-module3-10); box-shadow: inset 0 0 0 2px var(--theme-module3-100);";
  }
  if (returnStatus === ReturnStatus.AWAITING_REVIEWS) {
    return "border-color: var(--error-success-100); background-color: var(--error-success-10)";
  }
};

export default GuideCard;
