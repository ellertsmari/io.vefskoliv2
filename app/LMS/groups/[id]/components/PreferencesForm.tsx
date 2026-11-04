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
  Card,
  MutedText,
  ChipRow,
  SelectableChip,
  TextArea,
  PrimaryButton,
  Message,
  SubmittedNote,
} from "../../styles";
import {
  QuestionFlow,
  ReviewItem,
  ReviewList,
  DoneBurst,
  useDelayedAdvance,
  type FlowStep,
} from "./QuestionFlow";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FlowCard = styled(Card)`
  padding: 1.75rem 2rem;

  @media (max-width: 560px) {
    padding: 1.25rem 1rem;
  }
`;

/** Answers get bigger targets than filter chips: they are the whole screen. */
const BigChip = styled(SelectableChip)`
  padding: 0.7rem 1.2rem;
  font-size: var(--text-base);
  transition: background-color 0.15s ease, border-color 0.15s ease,
    color 0.15s ease, transform 0.15s ease;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }
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
  onSaved,
}: {
  details: GroupProjectDetails;
  /** Called after a successful save — the page moves on to the brief. */
  onSaved?: () => void;
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
      // Let the tick play before the page moves on to the brief.
      setTimeout(() => onSaved?.(), 1400);
    }
  };

  const lastIndex = 6;
  const [index, setIndex] = useState(() => {
    if (complete) return lastIndex;
    const answered = [!!ambition, focus.length > 0, techStack.length > 0, !!schedule, !!location];
    const first = answered.indexOf(false);
    return first === -1 ? lastIndex : first;
  });
  const advanceSoon = useDelayedAdvance(() =>
    setIndex((current) => Math.min(current + 1, lastIndex))
  );

  /** A single-choice question: pick moves on, picking again clears. */
  const single = (
    options: readonly string[],
    icons: Record<string, string | undefined>,
    value: string,
    set: (next: string) => void
  ) => (
    <ChipRow role="radiogroup">
      {options.map((option) => (
        <BigChip
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          $selected={value === option}
          onClick={() => {
            if (value === option) {
              set("");
            } else {
              set(option);
              advanceSoon();
            }
          }}
        >
          <IconChipLabel icon={icons[option]}>{option}</IconChipLabel>
        </BigChip>
      ))}
    </ChipRow>
  );

  const multi = (
    options: readonly string[],
    icons: Record<string, string | undefined>,
    list: string[],
    set: (next: string[]) => void
  ) => (
    <ChipRow>
      {options.map((option) => (
        <BigChip
          key={option}
          type="button"
          aria-pressed={list.includes(option)}
          $selected={list.includes(option)}
          onClick={() => toggle(option, list, set)}
        >
          <IconChipLabel icon={icons[option]}>{option}</IconChipLabel>
        </BigChip>
      ))}
    </ChipRow>
  );

  const pickAll = "Pick as many as you like.";

  const steps: FlowStep[] = [
    {
      id: "ambition",
      label: "Ambition",
      title: "How ambitious are you for this project?",
      content: single(AMBITION_OPTIONS, AMBITION_ICONS, ambition, setAmbition),
      complete: !!ambition,
      missingHint: "Pick one to continue",
    },
    {
      id: "focus",
      label: "Focus",
      title: "What do you want to focus on?",
      description: pickAll,
      content: multi(FOCUS_OPTIONS, FOCUS_ICONS, focus, setFocus),
      complete: focus.length > 0,
      missingHint: "Pick at least one",
    },
    {
      id: "tech",
      label: "Tech",
      title: "Which tech do you want to work with?",
      description: pickAll,
      content: multi(techOptions, TECH_STACK_ICONS, techStack, setTechStack),
      complete: techStack.length > 0,
      missingHint: "Pick at least one",
    },
    {
      id: "schedule",
      label: "Schedule",
      title: "When do you want to work?",
      content: single(SCHEDULE_OPTIONS, SCHEDULE_ICONS, schedule, setSchedule),
      complete: !!schedule,
      missingHint: "Pick one to continue",
    },
    {
      id: "location",
      label: "Location",
      title: "Where do you want to work?",
      content: single(LOCATION_OPTIONS, LOCATION_ICONS, location, setLocation),
      complete: !!location,
      missingHint: "Pick one to continue",
    },
    {
      id: "about",
      label: "Anything else",
      title: "Anything else your teachers should know?",
      description: "Optional — skip it if nothing comes to mind.",
      content: (
        <TextArea
          id="about"
          aria-label="Anything else your teachers should know?"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Who you'd like to work with, what you want to practice, scheduling constraints…"
          maxLength={2000}
        />
      ),
      complete: !!about.trim(),
      optional: true,
    },
    {
      id: "review",
      label: "Review",
      eyebrow: "Last step",
      title: complete ? "Looks good — save your answers" : "Almost there",
      description: complete
        ? "Check your answers, then save. Saving unlocks the project brief."
        : "Answer the questions marked below to unlock the project brief.",
      complete,
      content: (
        <>
          <ReviewList>
            {[
              ["Ambition", ambition, 0],
              ["Focus", focus.join(", "), 1],
              ["Tech", techStack.join(", "), 2],
              ["Schedule", schedule, 3],
              ["Location", location, 4],
            ].map(([label, value, step], order) => (
              <ReviewItem
                key={label as string}
                order={order}
                label={label}
                value={(value as string) || "Not answered"}
                missing={!value}
                onEdit={() => setIndex(step as number)}
              />
            ))}
            <ReviewItem
              order={5}
              label="Anything else"
              value={about.trim() || "—"}
              onEdit={() => setIndex(5)}
            />
          </ReviewList>
          <Footer>
            <PrimaryButton type="submit" disabled={saving || !complete}>
              {saving
                ? "Saving…"
                : existing
                  ? "Save changes"
                  : "Save & unlock the brief"}
            </PrimaryButton>
            {feedback &&
              (feedback.error ? (
                <Message $error>{feedback.text}</Message>
              ) : (
                <DoneBurst>{feedback.text}</DoneBurst>
              ))}
          </Footer>
          {existing && complete && !feedback && (
            <SubmittedNote role="status">
              ✓ Your preferences are in. Change them any time while teams are
              forming.
            </SubmittedNote>
          )}
        </>
      ),
    },
  ];

  return (
    <Form onSubmit={handleSubmit}>
      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      <MutedText>
        Tell your teachers what you want to get out of this project — they use
        this to put together balanced teams. The project brief unlocks once
        you&apos;ve answered, and you can update your answers any time while
        teams are forming.
      </MutedText>
      <FlowCard>
        <QuestionFlow
          steps={steps}
          index={index}
          onIndexChange={setIndex}
          noun="Question"
        />
      </FlowCard>
    </Form>
  );
};
