import { SubTitle } from "globalStyles/text";
import { useState } from "react";
import {
  ExtendedGuideInfo,
  FeedbackDocumentWithReturn,
} from "../../guides/types";
import {
  FeedbackContainer,
  OverviewWrapper,
  InfoContainer,
  Link,
  ReturnButton,
  ReturnLinksWrapper,
  Border,
  FeedbackInfoContainer,
  ContentAndNavigatorContainer,
  ToggleContainer,
} from "./style";
import MarkdownReader from "components/markdown/reader";
import { ReturnDocument } from "../../models/return";
import { Toggle } from "components/toggle/Toggle";
import { OptionNavigator } from "components/optionNavigator/OptionNavigator";
import { useGuide } from "../../providers/GuideProvider";

export const FeedbackOverview = () => {
  const guide = useGuide() as ExtendedGuideInfo;
  const isFeedbackGiven = guide?.feedbackGiven?.length > 0;
  const isFeedbackReceived = guide?.feedbackReceived?.length > 0;

  const [showGivenOrReceived, setShowGivenOrReceived] = useState<
    "given" | "received" | null
  >(isFeedbackReceived ? "received" : isFeedbackGiven ? "given" : null);

  const [selectedGivenIndex, setSelectedGivenIndex] = useState<number>(0);
  const [selectedReceivedIndex, setSelectedReceivedIndex] = useState<number>(0);

  if (!showGivenOrReceived) {
    return <>No feedback yet.</>;
  }

  const { feedbackGiven, feedbackReceived } = guide;

  return (
    <FeedbackContainer>
      <ToggleContainer>
        <Toggle
          currentSelection={showGivenOrReceived}
          options={[
            ["given", () => setShowGivenOrReceived("given")],
            ["received", () => setShowGivenOrReceived("received")],
          ]}
        />
      </ToggleContainer>
      <FeedbackInfoContainer>
        <OverviewContent
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

const OverviewContent = ({
  theFeedback,
}: {
  theFeedback: FeedbackDocumentWithReturn | null;
}) => {
  const theReturn = theFeedback?.associatedReturn;

  if (!theFeedback || !theReturn) {
    return <>Nothing to show</>;
  }

  return (
    <OverviewWrapper>
      <InfoContainer>
        <SubTitle>Your Return</SubTitle>
        <ReturnLinks theReturn={theReturn} />
      </InfoContainer>
      <InfoContainer>
        <SubTitle>Project Title</SubTitle>
        {theReturn.projectName}
      </InfoContainer>
      <InfoContainer>
        <SubTitle>Project Comment</SubTitle>
        {theReturn.comment}
      </InfoContainer>
      <InfoContainer>
        <SubTitle>Grade</SubTitle>
        {theFeedback.grade ?? "Not graded yet"}
      </InfoContainer>
    </OverviewWrapper>
  );
};

const ReturnLinks = ({ theReturn }: { theReturn: ReturnDocument }) => {
  return (
    <>
      <ReturnLinksWrapper>
        <Link href={theReturn.projectUrl} target="_blank">
          <ReturnButton $styletype="outlined">Github or Figma URL</ReturnButton>
        </Link>
        <Link href={theReturn.liveVersion} target="_blank">
          <ReturnButton $styletype="outlined">
            <div>Live version or prototype (Figma)</div>
          </ReturnButton>
        </Link>
      </ReturnLinksWrapper>
    </>
  );
};
