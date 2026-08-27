import Modal from "UIcomponents/modal/modal";
import {
  ExtendedGuideInfo,
  ReviewStatus,
  ReturnStatus,
} from "types/guideTypes";
import { GuideProvider } from "providers/GuideProvider";
import { extractModuleNumber } from "utils/moduleUtils";
import { GuideCardOverview } from "../guideCardOverview/GuideCardOverview";
import { CardWrapper, InfoWrapper, type CardStatus } from "./style";
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
  const { returnStatus, reviewStatus, grade, gradesReceivedStatus } = guide;

  const link =
    guide.returnStatus === ReturnStatus.NOT_RETURNED ? guide.link : undefined;
  return (
    <GuideProvider guide={guide}>
      <CardWrapper>
        <InfoWrapper $status={cardStatusOf(returnStatus, reviewStatus)}>
          {link ? (
            <GuideCardOverview
              moduleTitle={extractModuleNumber(guide.module.title).toString()}
              guideTitle={guide.title}
              link={link}
              order={order}
              returnStatus={returnStatus}
              reviewStatus={reviewStatus}
              grade={grade}
              gradesReceivedStatus={gradesReceivedStatus}
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
                    gradesReceivedStatus={gradesReceivedStatus}
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

/**
 * Which surface the card wears. Returns a status rather than a CSS string so
 * the styled component can compose it — the old string set box-shadow itself,
 * which would now silently wipe out the card's resting shadow.
 */
const cardStatusOf = (
  returnStatus: ReturnStatus,
  reviewStatus: ReviewStatus
): CardStatus => {
  if (returnStatus === ReturnStatus.NOT_RETURNED) return "default";
  if (reviewStatus === ReviewStatus.NEED_TO_REVIEW) return "needsReview";
  if (returnStatus === ReturnStatus.PASSED) return "passed";
  if (returnStatus === ReturnStatus.FAILED) return "failed";
  if (returnStatus === ReturnStatus.HALL_OF_FAME) return "hallOfFame";
  if (returnStatus === ReturnStatus.AWAITING_REVIEWS) return "awaitingReviews";
  return "default";
};

export default GuideCard;
