import { SubHeading1 } from "globalStyles/text";
import { FeedbackDocumentWithReturn } from "types/guideTypes";
import { ReturnDocument } from "models/return";
import { Grade } from "../../grading/grade/Grade";
import {
  MaterialButton,
  UnstyledLink,
  Wrapper,
} from "globalStyles/globalStyles";
import { OverviewWrapper, ReturnLinksWrapper } from "./style";

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
      <Wrapper>
        <SubHeading1>RETURN DETAILS</SubHeading1>
        <ReturnLinks
          theReturn={theReturn}
          linkStyle={theFeedback ? "outlined" : "default"}
        />
      </Wrapper>
      <Wrapper>
        <SubHeading1>PROJECT TITLE</SubHeading1>
        {theReturn.projectName}
      </Wrapper>
      <Wrapper>
        <SubHeading1>PROJECT COMMENT</SubHeading1>
        {theReturn.comment}
      </Wrapper>
      {theFeedback && (
        <Wrapper>
          <Grade
            grade={theFeedback.grade}
            gradeable={gradeable}
            reviewId={theFeedback._id.toString()}
            key={theFeedback._id.toString()}
          />
        </Wrapper>
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
        <UnstyledLink href={theReturn.projectUrl} target="_blank">
          <MaterialButton $styletype={linkStyle}>
            Github or Figma URL
          </MaterialButton>
        </UnstyledLink>
        <UnstyledLink href={theReturn.liveVersion} target="_blank">
          <MaterialButton $styletype={linkStyle}>
            Live version or prototype (Figma)
          </MaterialButton>
        </UnstyledLink>
      </ReturnLinksWrapper>
    </>
  );
};
