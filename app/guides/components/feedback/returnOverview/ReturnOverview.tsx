import { SubHeading1 } from "globalStyles/text";
import { ReviewDocumentWithReturn } from "types/guideTypes";
import { ReturnDocument } from "models/return";
import { Grade } from "../../grading/grade/Grade";
import {
  MaterialButton,
  UnstyledLink,
  Wrapper,
} from "globalStyles/globalStyles";
import { OverviewWrapper, ReturnLinksWrapper } from "./style";
import { useGuide } from "providers/GuideProvider";
import { returnFieldsFor } from "utils/returnFields";

export const ReturnOverview = ({
  theReview,
  theReturn,
  gradeable = false,
  showGrade = true,
}: {
  theReview?: ReviewDocumentWithReturn;
  theReturn?: ReturnDocument;
  gradeable?: boolean;
  showGrade?: boolean;
}) => {
  if (theReview && theReturn)
    throw new Error(
      "ReturnOverview can only have one of the two props: theReview or theReturn"
    );
  if (theReview) theReturn = theReview.associatedReturn;

  if (!theReturn) {
    console.warn("No return found for this review");
    return null;
  }

  return (
    <OverviewWrapper>
      <Wrapper>
        <SubHeading1>RETURN DETAILS</SubHeading1>
        <ReturnLinks
          theReturn={theReturn}
          linkStyle={theReview ? "outlined" : "default"}
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
      {theReview && showGrade && (
        <Wrapper>
          <Grade
            grade={theReview.grade}
            gradeable={gradeable}
            reviewId={theReview._id.toString()}
            key={theReview._id.toString()}
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
  // The links are named for the guide's discipline — repository and live
  // page, or Figma file and prototype — the same words the form used.
  const { guide } = useGuide();
  const fields = returnFieldsFor(guide ?? {});
  return (
    <>
      <ReturnLinksWrapper>
        <UnstyledLink href={theReturn.projectUrl} target="_blank">
          <MaterialButton $styletype={linkStyle}>
            {fields.projectUrl.label}
          </MaterialButton>
        </UnstyledLink>
        <UnstyledLink href={theReturn.liveVersion} target="_blank">
          <MaterialButton $styletype={linkStyle}>
            {fields.liveVersion.label}
          </MaterialButton>
        </UnstyledLink>
      </ReturnLinksWrapper>
    </>
  );
};
