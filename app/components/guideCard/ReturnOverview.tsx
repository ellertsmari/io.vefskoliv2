import { SubTitle } from "globalStyles/text";
import { FeedbackDocumentWithReturn } from "../../guides/types";
import { ReturnDocument } from "../../models/return";
import {
  OverviewWrapper,
  InfoContainer,
  ReturnLinksWrapper,
  ReturnButton,
  Link,
} from "./style";

export const ReturnOverview = ({
  theFeedback,
  theReturn,
}: {
  theFeedback?: FeedbackDocumentWithReturn;
  theReturn?: ReturnDocument;
}) => {
  if (theFeedback && theReturn)
    throw new Error(
      "ReturnOverview can only have one of the two props: theFeedback or theReturn"
    );
  if (theFeedback) theReturn = theFeedback.associatedReturn;

  if (!theReturn) {
    throw new Error("ReturnOverview requires a return document");
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
          <SubTitle>GRADE</SubTitle>
          {theFeedback.grade ?? "Not graded yet"}
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
