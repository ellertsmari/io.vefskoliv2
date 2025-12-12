import { SubHeading1 } from "globalStyles/text";
import { useMemo, useState } from "react";
import {
  ReviewDocumentWithReturn,
  GradesGivenStatus,
  ReturnStatus,
} from "types/guideTypes";
import MarkdownReader from "UIcomponents/markdown/reader";
import { Toggle, ToggleOption } from "UIcomponents/toggle/Toggle";
import { OptionNavigator } from "UIcomponents/optionNavigator/OptionNavigator";
import { useGuide } from "providers/GuideProvider";
import { ReturnOverview } from "../returnOverview/ReturnOverview";
import { GiveFeedbackView } from "../giveFeedbackView/GiveFeedbackView";
import { Button } from "globalStyles/buttons/default/style";
import {
  FeedbackContainer,
  FeedbackInfoContainer,
  ContentAndNavigatorContainer,
  ToggleContainer,
  CommentWrapper,
  FeedbackContentWrapper,
} from "./style";
import { Border } from "globalStyles/globalStyles";
import { StyleColors } from "globalStyles/colors";
import { Vote } from "models/review";

export const FeedbackOverview = () => {
  const { guide } = useGuide();
  const isReviewGiven = useMemo(
    () => guide?.reviewsGiven?.length > 0,
    [guide]
  );
  const isReviewReceived = useMemo(
    () => guide?.reviewsReceived?.length > 0,
    [guide]
  );

  const [showGivenOrReceived, setShowGivenOrReceived] = useState<
    "given" | "received" | null
  >(isReviewReceived ? "received" : isReviewGiven ? "given" : null);

  const [selectedGivenIndex, setSelectedGivenIndex] = useState<number>(0);
  const [selectedReceivedIndex, setSelectedReceivedIndex] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  if (!guide) return null;
  const {
    reviewsGiven,
    reviewsReceived,
    returnsSubmitted,
    availableToGrade,
  } = guide;

  const theReview =
    showGivenOrReceived === "given"
      ? reviewsGiven[selectedGivenIndex]
      : reviewsReceived[selectedReceivedIndex];

  if (!showGivenOrReceived) {
    const theReturn = returnsSubmitted[0];
    return <ReturnOverview theReturn={theReturn} />;
  }

  const gradeable =
    showGivenOrReceived === "received" && theReview && !theReview.grade;

  const toggleOptions = () => {
    let options: ToggleOption[] = [];
    if (isReviewGiven) {
      options.push(["given", () => setShowGivenOrReceived("given")]);
    }
    if (isReviewReceived) {
      options.push([
        "received",
        () => setShowGivenOrReceived("received"),
        guide.gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE,
      ]);
    }

    return options;
  };

  const NavigatorOptions = () => {
    if (showGivenOrReceived === "given") {
      return reviewsGiven.map((review) =>
        review.grade ? StyleColors.purple : StyleColors.lightGrey
      );
    }
    return reviewsReceived.map((review) => {
      if (review.vote === Vote.PASS) return StyleColors.green;
      if (review.vote === Vote.NO_PASS) return StyleColors.red;
      return StyleColors.lightGrey;
    });
  };

  if (showReviewForm) {
    return <GiveFeedbackView guideTitle={guide.title} />;
  }

  return (
    <FeedbackContainer>
      <ToggleContainer>
        <Toggle
          currentSelection={showGivenOrReceived}
          options={toggleOptions()}
        />
        {guide.returnStatus !== ReturnStatus.NOT_RETURNED && guide.availableForReview.length > 0 && (
          <Button
            $styletype="outlined"
            onClick={() => setShowReviewForm(true)}
            style={{ marginLeft: 'auto' }}
          >
            Give More Reviews
          </Button>
        )}
      </ToggleContainer>
      <FeedbackInfoContainer>
        <ReturnOverview
          theReview={
            showGivenOrReceived === "given"
              ? reviewsGiven[selectedGivenIndex]
              : reviewsReceived[selectedReceivedIndex]
          }
          gradeable={gradeable}
          showGrade={showGivenOrReceived === "given"}
        />
        <ContentAndNavigatorContainer>
          <ReviewContent
            currentReview={
              showGivenOrReceived === "given"
                ? reviewsGiven[selectedGivenIndex]
                : reviewsReceived[selectedReceivedIndex]
            }
            subtitle={`REVIEW YOU ${
              showGivenOrReceived === "given" ? "GAVE" : "RECEIVED"
            }`}
          />
          <OptionNavigator
            optionsWithColor={NavigatorOptions()}
            selectedOption={
              showGivenOrReceived === "given"
                ? selectedGivenIndex
                : selectedReceivedIndex
            }
            selectOption={
              showGivenOrReceived === "given"
                ? (index) => {
                    setSelectedGivenIndex(index);
                  }
                : (index) => {
                    setSelectedReceivedIndex(index);
                  }
            }
          />
        </ContentAndNavigatorContainer>
      </FeedbackInfoContainer>
    </FeedbackContainer>
  );
};

const ReviewContent = ({
  currentReview,
  subtitle,
}: {
  subtitle: string;
  currentReview: ReviewDocumentWithReturn | null;
}) => {
  return (
    <FeedbackContentWrapper>
      <SubHeading1>{subtitle}</SubHeading1>
      <Border>
        <CommentWrapper>
          <MarkdownReader>
            {currentReview?.comment ?? "No review yet"}
          </MarkdownReader>
        </CommentWrapper>
      </Border>
    </FeedbackContentWrapper>
  );
};
