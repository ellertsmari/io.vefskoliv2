import { SubTitle } from "globalStyles/text";
import { FeedbackDocumentWithReturn } from "../../../types/guideTypes";
import { ReturnDocument } from "../../models/return";
import {
  OverviewWrapper,
  InfoContainer,
  ReturnLinksWrapper,
  ReturnButton,
  Link,
} from "./style";
import { Grade } from "../grade/Grade";

export const ReturnOverview = ({
  theFeedback,
  theReturn,
  gradeable = false,
}: {
  theFeedback?: FeedbackDocumentWithReturn;
  theReturn?: ReturnDocument;
  gradeable?: boolean;
}) => {
  if (theFeedback && theReturn)
    throw new Error(
      "ReturnOverview can only have one of the two props: theFeedback or theReturn"
    );
  if (theFeedback) theReturn = theFeedback.associatedReturn;

  if (!theReturn) {
    console.warn("No return found for this feedback");
    return null;
  }

  return (
    <OverviewWrapper>
      <InfoContainer>
        <SubTitle>RETURN DETAILS</SubTitle>
        <ReturnLinks
          theReturn={theReturn}
          linkStyle={theFeedback ? "outlined" : "default"}
        />
      </InfoContainer>
      <InfoContainer>
        <SubTitle>PROJECT TITLE</SubTitle>
        {theReturn.projectName}
      </InfoContainer>
      <InfoContainer>
        <SubTitle>PROJECT COMMENT</SubTitle>
        {theReturn.comment}
      </InfoContainer>
      {theFeedback && (
        <InfoContainer>
          <Grade
            grade={theFeedback.grade}
            gradeable={gradeable}
            reviewId={theFeedback._id.toString()}
            key={theFeedback._id.toString()}
          />
        </InfoContainer>
      )}
    </OverviewWrapper>
  );
};

const ReturnLinks = ({
  theReturn,
  linkStyle,
}: {
  theReturn: ReturnDocument;
  linkStyle: "default" | "outlined";
}) => {
  return (
    <>
      <ReturnLinksWrapper>
        <Link href={theReturn.projectUrl} target="_blank">
          <ReturnButton $styletype={linkStyle}>
            Github or Figma URL
          </ReturnButton>
        </Link>
        <Link href={theReturn.liveVersion} target="_blank">
          <ReturnButton $styletype={linkStyle}>
            Live version or prototype (Figma)
          </ReturnButton>
        </Link>
      </ReturnLinksWrapper>
    </>
  );
};
