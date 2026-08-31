"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { SerializedJudgeInvitation } from "types/groupTypes";
import {
  JUDGE_FOCUS_LABELS,
  JUDGE_FOCUS_OPTIONS,
  JudgeFocus,
} from "constants/groupWork";
import {
  createJudgeInvitation,
  deleteJudgeInvitation,
  updateJudgeFocus,
} from "serverActions/groups/manageJudges";
import {
  Card,
  SectionTitle,
  MutedText,
  ChipRow,
  SelectableChip,
  Label,
  Input,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  Message,
  Pill,
} from "../../styles";

const JudgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--primary-black-10);

  &:last-child {
    border-bottom: none;
  }
`;

const JudgeName = styled.span`
  font-weight: 600;
  font-size: var(--text-sm);
`;

const Actions = styled.span`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

export const JudgesPanel = ({
  projectId,
  judges,
}: {
  projectId: string;
  judges: SerializedJudgeInvitation[];
}) => {
  const router = useRouter();
  // window is unavailable during server render of this client component
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const judgeUrl = (token: string) => `${origin}/judge/${token}`;

  const [name, setName] = useState("");
  const [focus, setFocus] = useState<JudgeFocus>("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await createJudgeInvitation({
      projectId,
      name,
      focus,
    });
    setBusy(false);
    if (result.success) {
      setName("");
      setFocus("all");
      setMessage({ text: "Judge invited — send them their link!", error: false });
      router.refresh();
    } else {
      setMessage({ text: result.message, error: true });
    }
  };

  const handleDelete = async (invitationId: string) => {
    setBusy(true);
    setMessage(null);
    const result = await deleteJudgeInvitation({ invitationId });
    setBusy(false);
    if (result.success) {
      router.refresh();
    } else {
      setMessage({ text: result.message, error: true });
    }
  };

  const handleFocus = async (invitationId: string, focus: JudgeFocus) => {
    setBusy(true);
    setMessage(null);
    const result = await updateJudgeFocus({ invitationId, focus });
    setBusy(false);
    if (result.success) {
      router.refresh();
    } else {
      setMessage({ text: result.message, error: true });
    }
  };

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(judgeUrl(token));
    setMessage({ text: "Link copied to clipboard", error: false });
  };

  return (
    <Card>
      <SectionTitle>External judges</SectionTitle>
      <MutedText>
        Invite industry professionals by copying their personal link and
        sending it to them — no account needed. They see every team&apos;s
        submitted links and grade with the same rubric; their grades count
        like teacher grades. A judge with a Design or Coding focus skips the
        other discipline, but everyone grades the general categories
        (presentation, Q&amp;A…). You can change what a judge counts towards
        at any time — including after they have graded, and after the grades
        are out.
      </MutedText>

      <form onSubmit={handleCreate}>
        <Label>
          Name
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Label>
        <Label as="div">
          Judging
          <ChipRow>
            {JUDGE_FOCUS_OPTIONS.map((option) => (
              <SelectableChip
                key={option}
                type="button"
                $selected={focus === option}
                onClick={() => setFocus(option)}
              >
                {JUDGE_FOCUS_LABELS[option]}
              </SelectableChip>
            ))}
          </ChipRow>
        </Label>
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Working…" : "+ Invite judge"}
        </PrimaryButton>
      </form>

      {message && <Message $error={message.error}>{message.text}</Message>}

      {judges.length > 0 && (
        <div>
          {judges.map((judge) => (
            <JudgeRow key={judge._id}>
              <JudgeName>{judge.name}</JudgeName>
              {/* Judges often decide at the presentation itself what they are
                  willing to judge. Changing it here re-scopes the scores they
                  already gave: anything outside the new focus stops counting,
                  and comes back if it is widened again. */}
              <ChipRow>
                {JUDGE_FOCUS_OPTIONS.map((option) => (
                  <SelectableChip
                    key={option}
                    type="button"
                    $selected={judge.focus === option}
                    disabled={busy}
                    title={`Count this judge's scores towards ${JUDGE_FOCUS_LABELS[option]}`}
                    onClick={() => handleFocus(judge._id, option)}
                  >
                    {JUDGE_FOCUS_LABELS[option]}
                  </SelectableChip>
                ))}
              </ChipRow>
              {judge.hasSubmitted && <Pill>Has graded ✓</Pill>}
              {judge.showcaseNameConsent && (
                <Pill title="This judge agreed to be named when a team publishes one of their comments">
                  Named on showcase ✓
                </Pill>
              )}
              <Actions>
                <SecondaryButton
                  type="button"
                  onClick={() => handleCopy(judge.token)}
                >
                  Copy link
                </SecondaryButton>
                {!judge.hasSubmitted && (
                  <DangerButton
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(judge._id)}
                  >
                    Remove
                  </DangerButton>
                )}
              </Actions>
            </JudgeRow>
          ))}
        </div>
      )}
    </Card>
  );
};
