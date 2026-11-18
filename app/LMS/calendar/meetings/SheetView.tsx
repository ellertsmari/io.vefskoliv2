"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addSlot,
  assignSlot,
  claimSlot,
  deleteSignupSheet,
  releaseSlot,
  removeSlot,
} from "serverActions/signupSheets";
import { describeDate, normalizeTime } from "utils/calendarUtils";
import { clashOf, lengthLabel } from "utils/meetingUtils";
import type {
  CalendarEvent,
  SignupSheetInfo,
  SignupSlot,
} from "types/calendarTypes";
import type { ActionResult } from "utils/errors";
import { FormError, NativeSelect } from "../style";
import {
  CheckLabel,
  DialogBody,
  InlineForm,
  Muted,
  Notice,
  Pill,
  QuietButton,
  PrimaryButton,
  Section,
  SectionTitle,
  SlotActions,
  SlotList,
  SlotRow,
  SlotTime,
  SlotWho,
  SmallInput,
  Toolbar,
} from "./style";

type Props = {
  sheet: SignupSheetInfo;
  /** The viewer's calendar, to spot slots that clash with something. */
  events: CalendarEvent[];
  onDeleted: () => void;
};

/**
 * One sign-up sheet. People it is for take a slot with one click and can
 * move or give it back until it starts; slots that clash with their own
 * calendar are marked and can be hidden. Whoever runs the sheet sees who is
 * still missing and can clear, assign, add and remove slots.
 */
export const SheetView = ({ sheet, events, onDeleted }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [hideClashes, setHideClashes] = useState(false);
  const [newSlot, setNewSlot] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (action: () => Promise<ActionResult<void>>, after?: () => void) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        router.refresh();
        after?.();
      } else {
        setError(result.message);
        // Someone else may have got there first; show what is true now.
        router.refresh();
      }
    });
  };

  // This sheet's own entries on the calendar are not a clash with itself.
  const otherEvents = events.filter((event) => event.meetingRef?.id !== sheet.id);
  const clashFor = (slot: SignupSlot) =>
    clashOf(otherEvents, sheet.date, slot.startTime, slot.endTime);

  const mine = sheet.slots.find((slot) => slot.startTime === sheet.mySlot);
  const signing = sheet.canSignUp;
  const clashing = signing
    ? sheet.slots.filter((slot) => !slot.claims.some((c) => c.mine) && clashFor(slot))
        .length
    : 0;
  const shown = sheet.slots.filter(
    (slot) =>
      !(hideClashes && signing && !slot.claims.some((c) => c.mine) && clashFor(slot))
  );
  const allGone = sheet.slots.every((slot) => slot.past);

  return (
    <DialogBody>
      <Section>
        <Muted>
          {describeDate(sheet.date)} · {lengthLabel(sheet.slotMinutes)} each ·{" "}
          {sheet.audienceLabel}
          {!sheet.isOwner && ` · set up by ${sheet.ownerName}`}
        </Muted>
        {sheet.description && <Muted>{sheet.description}</Muted>}
      </Section>

      {signing &&
        (mine ? (
          <Notice $tone="done">
            <span>
              {sheet.signUpAs ? `${sheet.signUpAs} has` : "You have"}{" "}
              <strong>
                {mine.startTime}–{mine.endTime}
              </strong>
              . Pick another time to move.
            </span>
            {!mine.past && (
              <QuietButton
                type="button"
                disabled={isPending}
                onClick={() => run(() => releaseSlot(sheet.id))}
              >
                Give it back
              </QuietButton>
            )}
          </Notice>
        ) : allGone ? (
          <Notice $tone="warn">This sheet is over.</Notice>
        ) : (
          <Notice>
            {sheet.signUpAs
              ? `Pick a time for ${sheet.signUpAs}. One of you signs up for the whole team.`
              : "Pick a time that suits you."}
          </Notice>
        ))}

      {sheet.waiting && sheet.waiting.length > 0 && (
        <Notice $tone="warn">
          <span>
            Not signed up yet: {sheet.waiting.map((team) => team.label).join(", ")}
          </span>
        </Notice>
      )}
      {sheet.waiting && sheet.waiting.length === 0 && (
        <Notice $tone="done">Every team has a slot.</Notice>
      )}

      <Section>
        <Toolbar>
          <SectionTitle>Times</SectionTitle>
          {clashing > 0 && (
            <CheckLabel>
              <input
                type="checkbox"
                checked={hideClashes}
                onChange={(e) => setHideClashes(e.target.checked)}
              />
              Hide times I&apos;m busy ({clashing})
            </CheckLabel>
          )}
        </Toolbar>
        <SlotList>
          {shown.map((slot) => {
            const isMine = slot.claims.some((claim) => claim.mine);
            const clash = signing && !isMine ? clashFor(slot) : null;
            const canTake = signing && !isMine && !slot.full && !slot.past;
            const places = sheet.capacity - slot.claims.length;
            return (
              <SlotRow key={slot.startTime} $mine={isMine} $dim={slot.past && !isMine}>
                <SlotTime>
                  {slot.startTime}–{slot.endTime}
                </SlotTime>
                <SlotWho>
                  {slot.claims.length === 0 ? (
                    <span>
                      <Pill $tone="free">Free</Pill>
                    </span>
                  ) : (
                    slot.claims.map((claim) => (
                      <span key={claim.id}>
                        {claim.label}
                        {claim.mine && (
                          <>
                            {" "}
                            <Pill $tone="mine">
                              {sheet.byTeam ? "Your team" : "You"}
                            </Pill>
                          </>
                        )}
                        {claim.members && claim.members.length > 0 && (
                          <small>{claim.members.join(", ")}</small>
                        )}
                      </span>
                    ))
                  )}
                  {sheet.capacity > 1 && (
                    <small>
                      {places > 0
                        ? `${places} of ${sheet.capacity} places left`
                        : "Full"}
                    </small>
                  )}
                  {clash && <small>You have “{clash.title}” then</small>}
                </SlotWho>
                <SlotActions>
                  {sheet.canManage &&
                    slot.claims.map((claim) => (
                      <QuietButton
                        key={claim.id}
                        type="button"
                        $danger
                        disabled={isPending}
                        aria-label={`Clear ${claim.label} from ${slot.startTime}`}
                        onClick={() => run(() => assignSlot(sheet.id, claim.id, null))}
                      >
                        {slot.claims.length > 1 ? `Clear ${claim.label}` : "Clear"}
                      </QuietButton>
                    ))}
                  {canTake && (
                    <PrimaryButton
                      type="button"
                      disabled={isPending}
                      aria-label={`${mine ? "Move to" : "Take"} ${slot.startTime}`}
                      onClick={() => run(() => claimSlot(sheet.id, slot.startTime))}
                    >
                      {mine ? "Move here" : "Take"}
                    </PrimaryButton>
                  )}
                  {sheet.canManage &&
                    sheet.waiting &&
                    sheet.waiting.length > 0 &&
                    !slot.full && (
                      <NativeSelect
                        aria-label={`Assign a team to ${slot.startTime}`}
                        value=""
                        disabled={isPending}
                        onChange={(e) => {
                          const teamId = e.target.value;
                          if (teamId) {
                            run(() => assignSlot(sheet.id, teamId, slot.startTime));
                          }
                        }}
                      >
                        <option value="">Assign…</option>
                        {sheet.waiting.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.label}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  {sheet.canManage &&
                    slot.claims.length === 0 &&
                    sheet.slots.length > 1 && (
                      <QuietButton
                        type="button"
                        disabled={isPending}
                        aria-label={`Remove the ${slot.startTime} slot`}
                        onClick={() => run(() => removeSlot(sheet.id, slot.startTime))}
                      >
                        Remove
                      </QuietButton>
                    )}
                  {slot.past && !isMine && <Pill $tone="muted">Over</Pill>}
                </SlotActions>
              </SlotRow>
            );
          })}
        </SlotList>
        {shown.length === 0 && (
          <Muted>Every remaining time clashes with your calendar.</Muted>
        )}
        {error && <FormError role="alert">{error}</FormError>}
      </Section>

      {sheet.canManage && (
        <Section>
          <SectionTitle>Manage</SectionTitle>
          <Toolbar>
            <InlineForm
              onSubmit={(event) => {
                event.preventDefault();
                const time = normalizeTime(newSlot);
                if (time) run(() => addSlot(sheet.id, time), () => setNewSlot(""));
              }}
            >
              <SmallInput
                type="text"
                inputMode="numeric"
                placeholder="13:00"
                maxLength={5}
                aria-label="Start time of a new slot"
                value={newSlot}
                disabled={isPending}
                onChange={(e) => setNewSlot(e.target.value)}
              />
              <QuietButton type="submit" disabled={isPending || newSlot.trim() === ""}>
                Add a slot
              </QuietButton>
            </InlineForm>
            {confirmDelete ? (
              <span>
                <Muted as="span">Delete the sheet and every sign-up? </Muted>
                <QuietButton
                  type="button"
                  $danger
                  disabled={isPending}
                  onClick={() => run(() => deleteSignupSheet(sheet.id), onDeleted)}
                >
                  Delete
                </QuietButton>{" "}
                <QuietButton
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep
                </QuietButton>
              </span>
            ) : (
              <QuietButton
                type="button"
                $danger
                disabled={isPending}
                onClick={() => setConfirmDelete(true)}
              >
                Delete sheet
              </QuietButton>
            )}
          </Toolbar>
        </Section>
      )}
    </DialogBody>
  );
};
