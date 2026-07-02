"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails } from "types/groupTypes";
import {
  AMBITION_OPTIONS,
  FOCUS_OPTIONS,
  TECH_STACK_OPTIONS,
} from "constants/groupWork";
import { savePreferences } from "serverActions/groups/savePreferences";
import {
  Card,
  SectionTitle,
  MutedText,
  ChipRow,
  SelectableChip,
  Label,
  TextArea,
  PrimaryButton,
  Message,
} from "../../styles";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const PreferencesForm = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const router = useRouter();
  const existing = details.myPreferences;
  const [ambition, setAmbition] = useState(existing?.ambition || "");
  const [focus, setFocus] = useState<string[]>(existing?.focus || []);
  const [techStack, setTechStack] = useState<string[]>(
    existing?.techStack || []
  );
  const [about, setAbout] = useState(existing?.about || "");
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (
    value: string,
    list: string[],
    setList: (next: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await savePreferences({
      projectId: details.project._id,
      ambition: ambition as (typeof AMBITION_OPTIONS)[number] | "",
      focus: focus as (typeof FOCUS_OPTIONS)[number][],
      techStack: techStack as (typeof TECH_STACK_OPTIONS)[number][],
      about,
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Preferences saved!" : result.message,
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <MutedText>
        Tell your teachers what you want to get out of this project — they use
        this to put together balanced teams. You can update it any time while
        teams are forming.
      </MutedText>

      <Card>
        <SectionTitle>How ambitious are you for this project?</SectionTitle>
        <ChipRow>
          {AMBITION_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={ambition === option}
              onClick={() => setAmbition(ambition === option ? "" : option)}
            >
              {option}
            </SelectableChip>
          ))}
        </ChipRow>
      </Card>

      <Card>
        <SectionTitle>What do you want to focus on?</SectionTitle>
        <ChipRow>
          {FOCUS_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={focus.includes(option)}
              onClick={() => toggle(option, focus, setFocus)}
            >
              {option}
            </SelectableChip>
          ))}
        </ChipRow>
      </Card>

      <Card>
        <SectionTitle>Which tech do you want to work with?</SectionTitle>
        <ChipRow>
          {TECH_STACK_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={techStack.includes(option)}
              onClick={() => toggle(option, techStack, setTechStack)}
            >
              {option}
            </SelectableChip>
          ))}
        </ChipRow>
      </Card>

      <Card>
        <Label>
          <SectionTitle>Anything else your teachers should know?</SectionTitle>
          <TextArea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Who you'd like to work with, what you want to practice, scheduling constraints…"
            maxLength={2000}
          />
        </Label>
      </Card>

      <Footer>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </PrimaryButton>
        {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
      </Footer>
    </Form>
  );
};
