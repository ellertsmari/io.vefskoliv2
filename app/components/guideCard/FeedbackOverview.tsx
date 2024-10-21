import { SubTitle } from "globalStyles/text";
import { useEffect, useState } from "react";
import {
  ExtendedGuideInfo,
  FeedbackDocumentWithReturn,
} from "../../guides/types";
import {
  FeedbackContainer,
  Border,
  FeedbackInfoContainer,
  ContentAndNavigatorContainer,
  ToggleContainer,
} from "./style";
import MarkdownReader from "components/markdown/reader";
import { Toggle } from "components/toggle/Toggle";
import { OptionNavigator } from "components/optionNavigator/OptionNavigator";
import { useGuide } from "../../providers/GuideProvider";
import { ReturnOverview } from "./ReturnOverview";

export const FeedbackOverview = () => {
  const guide = useGuide() as ExtendedGuideInfo;
  const isFeedbackGiven = guide?.feedbackGiven?.length > 0;
  const isFeedbackReceived = guide?.feedbackReceived?.length > 0;

  const [showGivenOrReceived, setShowGivenOrReceived] = useState<
    "given" | "received" | null
  >(isFeedbackReceived ? "received" : isFeedbackGiven ? "given" : null);

  const [selectedGivenIndex, setSelectedGivenIndex] = useState<number>(0);
  const [selectedReceivedIndex, setSelectedReceivedIndex] = useState<number>(0);

  const {
    feedbackGiven,
    feedbackReceived,
    returnsSubmitted,
    availableToGrade,
  } = guide;

  const theReturn = returnsSubmitted[0];
  if (!showGivenOrReceived) {
    return <ReturnOverview theReturn={theReturn} />;
  }
  return (
    <FeedbackContainer>
      <ToggleContainer>
        <Toggle
          currentSelection={showGivenOrReceived}
          options={[
            ["given", () => setShowGivenOrReceived("given")],
            [
              "received",
              () => setShowGivenOrReceived("received"),
              availableToGrade?.length > 0,
            ],
          ]}
        />
      </ToggleContainer>
      <FeedbackInfoContainer>
        <ReturnOverview
          theFeedback={
            showGivenOrReceived === "given"
              ? feedbackGiven[selectedGivenIndex]
              : feedbackReceived[selectedReceivedIndex]
          }
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
