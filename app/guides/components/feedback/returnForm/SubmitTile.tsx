"use client";

import { useState } from "react";
import { Button } from "globalStyles/buttons/default/style";
import { UnstyledLink } from "globalStyles/globalStyles";
import { ReturnStatus } from "types/guideTypes";
import type { ReturnSummary } from "serverActions/getReturnSummary";
import { returnFieldsFor } from "utils/returnFields";
import { getDiscipline } from "utils/guideTaxonomy";
import { InlineReturnForm } from "./ReturnForm";
import {
  ReturnedPanel,
  ReturnedHeading,
  ReturnedNote,
  ReturnedProject,
  ReturnedActions,
  GuestPanel,
  SuccessText,
} from "./style.ReturnSuccess";

type GuideBits = {
  _id: { toString(): string };
  discipline?: string | null;
  category?: string | null;
  themeIdea?: { title?: string | null } | null;
};

/**
 * The Submit tile for a peer-reviewed guide.
 *
 * Before the first return it is the form. Afterwards it says where the
 * latest return stands, and the form only comes back when the student asks
 * for it: a fresh return after a "no pass", or a do-over when a link was
 * wrong. Showing an empty form under a returned project read as "you have
 * not done this", which was the complaint.
 */
export const SubmitTile = ({
  guide,
  summary,
}: {
  guide: GuideBits;
  summary: ReturnSummary | null;
}) => {
  const [showForm, setShowForm] = useState(summary === null);
  const guideId = guide._id.toString();
  const discipline = getDiscipline(guide);

  if (summary && !showForm) {
    return (
      <Returned
        guide={guide}
        summary={summary}
        onReturnAgain={() => setShowForm(true)}
      />
    );
  }

  return (
    <InlineReturnForm
      guideId={guideId}
      discipline={discipline}
      defaultTitle={guide.themeIdea?.title?.trim() || undefined}
      returningAgain={summary !== null}
      // Only offered once there is something to go back to.
      onDone={summary ? () => setShowForm(false) : undefined}
    />
  );
};

const TONE: Record<ReturnStatus, "ok" | "wait" | "bad" | "star"> = {
  [ReturnStatus.NOT_RETURNED]: "wait",
  [ReturnStatus.AWAITING_REVIEWS]: "wait",
  [ReturnStatus.PASSED]: "ok",
  [ReturnStatus.HALL_OF_FAME]: "star",
  [ReturnStatus.FAILED]: "bad",
};

const headingFor = (summary: ReturnSummary): string => {
  switch (summary.status) {
    case ReturnStatus.PASSED:
      return "Passed ✓";
    case ReturnStatus.HALL_OF_FAME:
      return "Hall of fame ★";
    case ReturnStatus.FAILED:
      return "Not passed";
    default:
      return "Returned ✓";
  }
};

const noteFor = (summary: ReturnSummary): string => {
  switch (summary.status) {
    case ReturnStatus.PASSED:
      return "Your return passed review. Your grade is on this guide's card on the guides page.";
    case ReturnStatus.HALL_OF_FAME:
      return "A reviewer recommended your project for the hall of fame. Your grade is on this guide's card on the guides page.";
    case ReturnStatus.FAILED:
      return "The reviewers did not pass this return. Read their feedback on this guide's card, fix what they pointed out, and return again — reviews are given on your latest return.";
    default:
      return `Waiting for reviews: ${summary.reviewsReceived} of ${summary.reviewsNeeded} in. You can still return again if something was wrong with the links.`;
  }
};

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Returned = ({
  guide,
  summary,
  onReturnAgain,
}: {
  guide: GuideBits;
  summary: ReturnSummary;
  onReturnAgain: () => void;
}) => {
  const fields = returnFieldsFor(guide);
  const failed = summary.status === ReturnStatus.FAILED;

  return (
    <ReturnedPanel aria-live="polite">
      <ReturnedHeading $tone={TONE[summary.status]}>
        {headingFor(summary)}
      </ReturnedHeading>
      <ReturnedNote>{noteFor(summary)}</ReturnedNote>
      <ReturnedProject>
        <dt>Project</dt>
        <dd>{summary.projectName}</dd>
        <dt>{fields.projectUrl.label}</dt>
        <dd>
          <a href={summary.projectUrl} target="_blank" rel="noopener noreferrer">
            {summary.projectUrl}
          </a>
        </dd>
        <dt>{fields.liveVersion.label}</dt>
        <dd>
          <a href={summary.liveVersion} target="_blank" rel="noopener noreferrer">
            {summary.liveVersion}
          </a>
        </dd>
        <dt>Returned</dt>
        <dd>
          {dateOf(summary.returnedAt)}
          {summary.returnCount > 1 && ` · return ${summary.returnCount}`}
        </dd>
      </ReturnedProject>
      <ReturnedActions>
        <Button
          type="button"
          $styletype={failed ? "default" : "outlined"}
          onClick={onReturnAgain}
        >
          RETURN AGAIN
        </Button>
        <UnstyledLink href="/guides">
          <Button type="button" $styletype="textButton" style={{ color: "var(--primary-black-100)" }}>
            SEE REVIEWS AND GRADE
          </Button>
        </UnstyledLink>
      </ReturnedActions>
    </ReturnedPanel>
  );
};

/** What a visitor sees where the form would be. */
export const GuestSubmit = ({ guideId }: { guideId: string }) => (
  <GuestPanel>
    <SuccessText>
      Students return this guide here and get it reviewed by classmates.
    </SuccessText>
    <UnstyledLink
      href={`/signin?callbackUrl=${encodeURIComponent(`/guides/${guideId}`)}`}
    >
      <Button type="button" $styletype="default">
        SIGN IN TO RETURN THIS GUIDE
      </Button>
    </UnstyledLink>
  </GuestPanel>
);
