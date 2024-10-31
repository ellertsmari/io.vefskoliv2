import { SubTitle } from "globalStyles/text";
import { useCallback, useMemo, useState } from "react";
import {
  ExtendedGuideInfo,
  FeedbackDocumentWithReturn,
  GradesGivenStatus,
} from "../../../types/guideTypes";
import {
  FeedbackContainer,
  Border,
  FeedbackInfoContainer,
  ContentAndNavigatorContainer,
  ToggleContainer,
} from "./style";
import MarkdownReader from "components/markdown/reader";
import { Toggle, ToggleOption } from "components/toggle/Toggle";
import { OptionNavigator } from "components/optionNavigator/OptionNavigator";
import { useGuide } from "../../providers/GuideProvider";
import { ReturnOverview } from "./ReturnOverview";

export const FeedbackOverview = () => {
  const { guide } = useGuide();
  const isFeedbackGiven = useMemo(
    () => guide?.feedbackGiven?.length > 0,
    [guide]
  );
  const isFeedbackReceived = useMemo(
    () => guide?.feedbackReceived?.length > 0,
    [guide]
  );

  const [showGivenOrReceived, setShowGivenOrReceived] = useState<
    "given" | "received" | null
  >(isFeedbackReceived ? "received" : isFeedbackGiven ? "given" : null);

  const [selectedGivenIndex, setSelectedGivenIndex] = useState<number>(0);
  const [selectedReceivedIndex, setSelectedReceivedIndex] = useState<number>(0);

  if (!guide) return null;
  const {
    feedbackGiven,
    feedbackReceived,
    returnsSubmitted,
    availableToGrade,
  } = guide;

  const theFeedback =
    showGivenOrReceived === "given"
      ? feedbackGiven[selectedGivenIndex]
      : feedbackReceived[selectedReceivedIndex];

  if (!showGivenOrReceived) {
    const theReturn = returnsSubmitted[0];
    return <ReturnOverview theReturn={theReturn} />;
  }

  const gradeable =
    showGivenOrReceived === "received" && theFeedback && !theFeedback.grade;

  const toggleOptions = useCallback(() => {
    let options: ToggleOption[] = [];
    if (isFeedbackGiven) {
      options.push(["given", () => setShowGivenOrReceived("given")]);
    }
    if (isFeedbackReceived) {
      options.push([
        "received",
        () => setShowGivenOrReceived("received"),
        guide.gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE,
      ]);
    }

    return options;
  }, [isFeedbackGiven, isFeedbackReceived, availableToGrade]);

  return (
    <FeedbackContainer>
      <ToggleContainer>
        <Toggle
          currentSelection={showGivenOrReceived}
          options={toggleOptions()}
        />
      </ToggleContainer>
      <FeedbackInfoContainer>
        <ReturnOverview
          theFeedback={
            showGivenOrReceived === "given"
              ? feedbackGiven[selectedGivenIndex]
              : feedbackReceived[selectedReceivedIndex]
          }
          gradeable={gradeable}
        />
        <ContentAndNavigatorContainer>
          <FeedbackContent
            currentFeedback={
              showGivenOrReceived === "given"
                ? feedbackGiven[selectedGivenIndex]
                : feedbackReceived[selectedReceivedIndex]
            }
            subtitle={`FEEDBACK YOU ${
              showGivenOrReceived === "given" ? "GAVE" : "RECEIVED"
            }`}
          />
          <OptionNavigator
            numOptions={
              showGivenOrReceived === "given"
                ? feedbackGiven.length
                : feedbackReceived.length
            }
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

const FeedbackContent = ({
  currentFeedback,
  subtitle,
}: {
  subtitle: string;
  currentFeedback: FeedbackDocumentWithReturn | null;
}) => {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <SubTitle>{subtitle}</SubTitle>
      <Border>
        <MarkdownReader>
          {currentFeedback?.comment ?? "No feedback yet"}
        </MarkdownReader>
      </Border>
    </div>
  );
};
