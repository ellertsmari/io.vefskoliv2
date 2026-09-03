"use client";
import { useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { GroupProjectDetails } from "types/groupTypes";
import {
  AMBITION_ICONS,
  AMBITION_OPTIONS,
  FOCUS_ICONS,
  FOCUS_OPTIONS,
  LOCATION_ICONS,
  LOCATION_OPTIONS,
  SCHEDULE_ICONS,
  SCHEDULE_OPTIONS,
  TECH_STACK_ICONS,
  TECH_STACK_OPTIONS,
  techStackOptionsForModule,
} from "constants/groupWork";
import { savePreferences } from "serverActions/groups/savePreferences";
import {
  QuestionGrid,
  QuestionCard,
  WideQuestionCard,
  QuestionTitle,
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

const ChipContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  svg {
    font-size: 1.1em;
  }
`;

const IconChipLabel = ({
  icon,
  children,
}: {
  icon?: string;
  children: React.ReactNode;
}) => (
  <ChipContent>
    {icon && <Icon icon={icon} aria-hidden />}
    {children}
  </ChipContent>
);

export const PreferencesForm = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const router = useRouter();
  const existing = details.myPreferences;
  const techOptions = techStackOptionsForModule(details.project.module);
  const [ambition, setAmbition] = useState(existing?.ambition || "");
  const [focus, setFocus] = useState<string[]>(existing?.focus || []);
  const [techStack, setTechStack] = useState<string[]>(
    // drop stale picks that are no longer offered for this module
    (existing?.techStack || []).filter((tech) =>
      (techOptions as readonly string[]).includes(tech)
    )
  );
  const [schedule, setSchedule] = useState(existing?.schedule || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [about, setAbout] = useState(existing?.about || "");
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const draft = useFormDraft(
    `preferences:${details.project._id}`,
    { ambition, focus, techStack, schedule, location, about },
    (saved) => {
      setAmbition(saved.ambition);
      setFocus(saved.focus);
      setTechStack(saved.techStack);
      setSchedule(saved.schedule);
      setLocation(saved.location);
      setAbout(saved.about);
    }
  );

  // Mirrors `isPreferenceComplete` on the server — the brief only unlocks once
  // every question is answered, so say so before they hit save.
  const complete =
    !!ambition &&
    focus.length > 0 &&
    techStack.length > 0 &&
    !!schedule &&
    !!location;

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
      schedule: schedule as (typeof SCHEDULE_OPTIONS)[number] | "",
      location: location as (typeof LOCATION_OPTIONS)[number] | "",
      about,
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Preferences saved!" : result.message,
      error: !result.success,
    });
    if (result.success) {
      draft.clear();
      router.refresh();
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      <MutedText>
        Tell your teachers what you want to get out of this project — they use
        this to put together balanced teams. The project brief unlocks once
        you&apos;ve answered, and you can update your answers any time while
        teams are forming.
      </MutedText>

      <QuestionGrid>
        <QuestionCard>
          <QuestionTitle>How ambitious are you for this project?</QuestionTitle>
          <ChipRow>
            {AMBITION_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={ambition === option}
              onClick={() => setAmbition(ambition === option ? "" : option)}
            >
              <IconChipLabel icon={AMBITION_ICONS[option]}>
                {option}
              </IconChipLabel>
            </SelectableChip>
          ))}
          </ChipRow>
        </QuestionCard>

        <QuestionCard>
          <QuestionTitle>What do you want to focus on?</QuestionTitle>
          <ChipRow>
            {FOCUS_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={focus.includes(option)}
              onClick={() => toggle(option, focus, setFocus)}
            >
              <IconChipLabel icon={FOCUS_ICONS[option]}>{option}</IconChipLabel>
            </SelectableChip>
          ))}
          </ChipRow>
        </QuestionCard>

        <QuestionCard>
          <QuestionTitle>Which tech do you want to work with?</QuestionTitle>
          <ChipRow>
            {techOptions.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={techStack.includes(option)}
              onClick={() => toggle(option, techStack, setTechStack)}
            >
              <IconChipLabel icon={TECH_STACK_ICONS[option]}>
                {option}
              </IconChipLabel>
            </SelectableChip>
          ))}
          </ChipRow>
        </QuestionCard>

        <QuestionCard>
          <QuestionTitle>When do you want to work?</QuestionTitle>
          <ChipRow>
            {SCHEDULE_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={schedule === option}
              onClick={() => setSchedule(schedule === option ? "" : option)}
            >
              <IconChipLabel icon={SCHEDULE_ICONS[option]}>
                {option}
              </IconChipLabel>
            </SelectableChip>
          ))}
          </ChipRow>
        </QuestionCard>

        <QuestionCard>
          <QuestionTitle>Where do you want to work?</QuestionTitle>
          <ChipRow>
            {LOCATION_OPTIONS.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={location === option}
              onClick={() => setLocation(location === option ? "" : option)}
            >
              <IconChipLabel icon={LOCATION_ICONS[option]}>
                {option}
              </IconChipLabel>
            </SelectableChip>
          ))}
          </ChipRow>
        </QuestionCard>

        <WideQuestionCard>
          <QuestionTitle as="label" htmlFor="about">
            Anything else your teachers should know?
          </QuestionTitle>
          <TextArea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Who you'd like to work with, what you want to practice, scheduling constraints…"
            maxLength={2000}
          />
        </WideQuestionCard>
      </QuestionGrid>

      <Footer>
        <PrimaryButton type="submit" disabled={saving || !complete}>
          {saving ? "Saving…" : "Save preferences"}
        </PrimaryButton>
        {!complete && (
          <MutedText>
            Answer every question above to unlock the project brief.
          </MutedText>
        )}
        {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
      </Footer>
    </Form>
  );
};
