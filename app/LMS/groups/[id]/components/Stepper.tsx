"use client";

import { Icon } from "@iconify/react";
import {
  StepList,
  StepButton,
  StepMarker,
  StepText,
  StepLabel,
  StepHint,
  StepConnector,
  StepCurrentHint,
} from "../../styles";

export type StepState = "done" | "current" | "available" | "locked";

export type Step = {
  id: string;
  label: string;
  /** Why the step is locked, or what to do next. Shown under the label. */
  hint?: string;
  /** Nothing to do here yet — the step shows, greyed, but can't be opened. */
  locked?: boolean;
  /** The student has finished this one. */
  done?: boolean;
};

type Props = {
  steps: Step[];
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * The student's route through a group project, as a numbered sequence rather
 * than a row of tabs. Tabs imply four equal, always-available places; this is
 * one path where each step opens when the one before it is finished, so the
 * shape of the control should say so.
 *
 * Locked steps stay visible on purpose — seeing what is coming, and why it is
 * not open yet, is most of the value. They are `aria-disabled` rather than
 * `disabled` so a screen reader still lands on them and reads the reason.
 */
export const Stepper = ({ steps, activeId, onSelect }: Props) => {
  const current = steps.find((step) => step.id === activeId);
  return (
    <>
      <StepList aria-label="Project steps">
        {steps.map((step, index) => {
          const state: StepState = step.locked
            ? "locked"
            : step.id === activeId
              ? "current"
              : step.done
                ? "done"
                : "available";

          return (
            <StepButton
              key={step.id}
              type="button"
              $state={state}
              aria-disabled={step.locked || undefined}
              aria-current={step.id === activeId ? "step" : undefined}
              onClick={() => {
                if (!step.locked) onSelect(step.id);
              }}
            >
              <StepMarker $state={step.done && step.locked ? "done" : state}>
                {step.done ? (
                  <Icon icon="mdi:check" aria-hidden />
                ) : step.locked ? (
                  <Icon icon="mdi:lock-outline" aria-hidden />
                ) : (
                  index + 1
                )}
              </StepMarker>
              <StepText>
                <StepLabel>{step.label}</StepLabel>
                {step.hint && <StepHint>{step.hint}</StepHint>}
              </StepText>
              {/* Decorative rule joining one step to the next; the last has none. */}
              {index < steps.length - 1 && <StepConnector aria-hidden="true" />}
            </StepButton>
          );
        })}
      </StepList>
      {current?.hint && <StepCurrentHint>{current.hint}</StepCurrentHint>}
    </>
  );
};
