"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMeetingPoll,
  savePollAvailability,
  schedulePoll,
} from "serverActions/meetingPolls";
import { describeDate } from "utils/calendarUtils";
import {
  cellKey,
  clashOf,
  fromMinutes,
  lengthLabel,
  pollCellMinutes,
  pollOptions,
  pollTimes,
  toMinutes,
} from "utils/meetingUtils";
import type {
  CalendarEvent,
  MeetingPollInfo,
  PollOption,
} from "types/calendarTypes";
import { FormError } from "../style";
import {
  CheckLabel,
  DialogBody,
  GridWrap,
  LegendRow,
  Muted,
  Notice,
  PollCell,
  PollCorner,
  PollDayHead,
  PollGrid,
  PollTimeLabel,
  PrimaryButton,
  QuietButton,
  Section,
  SectionTitle,
  SlotActions,
  SlotList,
  SlotRow,
  SlotTime,
  SlotWho,
  Swatch,
  Tab,
  Tabs,
  Toolbar,
} from "./style";

type Props = {
  poll: MeetingPollInfo;
  /** The viewer's calendar, to show when they are already busy. */
  events: CalendarEvent[];
  onGone: () => void;
};

/** How many of the best times to list. */
const BEST_SHOWN = 5;

/** "Thu 19 Nov" from a date key. */
const shortDate = (key: string) => {
  const [weekday, day, month] = describeDate(key).split(" ");
  return `${weekday} ${day} ${month.slice(0, 3)}`;
};

/**
 * One "find a time" poll, in two tabs.
 *
 * "When I can": a grid of days by times; click or drag to mark when you are
 * free. Times that already have something on your calendar are striped, and
 * one button marks everything else. It saves as you go.
 *
 * "Everyone": the same grid shaded by how many people are free, with the
 * best times listed on top. Whoever runs the poll picks one, which puts the
 * meeting on the calendar.
 */
export const PollView = ({ poll, events, onGone }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"mine" | "group">(poll.answered ? "group" : "mine");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [hideBusy, setHideBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cell = pollCellMinutes(poll.lengthMinutes);
  const tall = cell === 30;
  const times = useMemo(
    () => pollTimes(poll.dayStart, poll.dayEnd, poll.lengthMinutes),
    [poll.dayStart, poll.dayEnd, poll.lengthMinutes]
  );

  // The viewer's answer lives here while they paint; the server copy follows.
  const [mine, setMine] = useState<Set<string>>(
    () => new Set(poll.responses.find((response) => response.mine)?.cells ?? [])
  );
  const mineRef = useRef(mine);
  useEffect(() => {
    mineRef.current = mine;
  }, [mine]);
  /** While dragging: whether the drag adds or removes. */
  const painting = useRef<boolean | null>(null);

  const busyCells = useMemo(() => {
    const busy = new Map<string, string>();
    for (const day of poll.days) {
      for (const time of times) {
        const clash = clashOf(events, day, time, fromMinutes(toMinutes(time) + cell));
        if (clash) busy.set(cellKey(day, time), clash.title);
      }
    }
    return busy;
  }, [poll.days, times, events, cell]);

  const save = (cells: Set<string>) => {
    setError(undefined);
    setSaved("saving");
    startTransition(async () => {
      const result = await savePollAvailability(poll.id, [...cells]);
      if (result.success) {
        setSaved("saved");
        router.refresh();
      } else {
        setSaved("idle");
        setError(result.message);
      }
    });
  };

  const paint = (key: string, on: boolean) =>
    setMine((prev) => {
      if (prev.has(key) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  // A drag ends wherever the pointer is let go, on the grid or off it.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const stop = () => {
      if (painting.current === null) return;
      painting.current = null;
      saveRef.current(mineRef.current);
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const setAll = (cells: Set<string>) => {
    setMine(cells);
    save(cells);
  };

  const options = useMemo(() => pollOptions(poll), [poll]);
  const clashFor = (option: PollOption) =>
    clashOf(events, option.date, option.startTime, option.endTime);
  const clashing = options.filter((option) => clashFor(option)).length;
  const best = options
    .filter((option) => !(hideBusy && clashFor(option)))
    .slice(0, BEST_SHOWN);

  const answered = poll.responses.length;
  const heat = useMemo(() => {
    const counts = new Map<string, string[]>();
    for (const response of poll.responses) {
      for (const key of response.cells) {
        const names = counts.get(key);
        if (names) names.push(response.name);
        else counts.set(key, [response.name]);
      }
    }
    return counts;
  }, [poll.responses]);

  /** Scheduling and deleting both end the poll; on success, leave the view. */
  const finish = (action: () => Promise<{ success: boolean; message?: string }>) => {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        router.refresh();
        onGone();
      } else {
        setError(result.message ?? "Something went wrong");
        setConfirming(null);
      }
    });
  };

  const grid = (mode: "mine" | "group") => (
    <GridWrap>
      <PollGrid
        $days={poll.days.length}
        $paint={mode === "mine"}
        role="grid"
        aria-label={mode === "mine" ? "When I am free" : "When everyone is free"}
      >
        <PollCorner />
        {poll.days.map((day) => {
          const [weekday, date, month] = describeDate(day).split(" ");
          return (
            <PollDayHead key={day}>
              {weekday}
              <small>
                {date} {month.slice(0, 3)}
              </small>
            </PollDayHead>
          );
        })}
        {times.map((time) => {
          const onHour = time.endsWith(":00");
          return (
            <Fragment key={time}>
              <PollTimeLabel $tall={tall}>{onHour ? time : ""}</PollTimeLabel>
              {poll.days.map((day) => {
                const key = cellKey(day, time);
                const busyWith = busyCells.get(key);
                const label = `${shortDate(day)} ${time}`;
                if (mode === "mine") {
                  const on = mine.has(key);
                  return (
                    <PollCell
                      key={key}
                      type="button"
                      $tall={tall}
                      $hour={onHour}
                      $on={on}
                      $busy={!!busyWith}
                      aria-pressed={on}
                      aria-label={`${label}, ${on ? "free" : "not free"}${busyWith ? `, you have ${busyWith}` : ""}`}
                      title={busyWith ? `${label} · you have “${busyWith}”` : label}
                      onPointerDown={(event) => {
                        // Let the drag reach the other cells, on touch too.
                        (event.target as Element).releasePointerCapture?.(event.pointerId);
                        painting.current = !on;
                        paint(key, !on);
                      }}
                      onPointerEnter={() => {
                        if (painting.current !== null) paint(key, painting.current);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        const next = new Set(mine);
                        if (on) next.delete(key);
                        else next.add(key);
                        setAll(next);
                      }}
                    />
                  );
                }
                const names = heat.get(key) ?? [];
                return (
                  <PollCell
                    key={key}
                    type="button"
                    disabled
                    $tall={tall}
                    $hour={onHour}
                    $heat={answered > 0 ? names.length / answered : 0}
                    aria-label={`${label}, ${names.length} of ${answered} free`}
                    title={
                      names.length > 0
                        ? `${label} · ${names.join(", ")}`
                        : `${label} · nobody`
                    }
                  />
                );
              })}
            </Fragment>
          );
        })}
      </PollGrid>
    </GridWrap>
  );

  return (
    <DialogBody>
      <Section>
        <Muted>
          {lengthLabel(poll.lengthMinutes)} · {poll.audienceLabel}
          {!poll.isOwner && ` · asked by ${poll.ownerName}`} · {answered}
          {poll.invited ? ` of ${poll.invited}` : ""} answered
        </Muted>
        {poll.description && <Muted>{poll.description}</Muted>}
      </Section>

      <Tabs role="tablist">
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "mine"}
          $active={tab === "mine"}
          onClick={() => setTab("mine")}
        >
          When I can
        </Tab>
        <Tab
          type="button"
          role="tab"
          aria-selected={tab === "group"}
          $active={tab === "group"}
          onClick={() => setTab("group")}
        >
          Everyone ({answered})
        </Tab>
      </Tabs>

      {tab === "mine" && (
        <Section>
          <Toolbar>
            <Muted>Click or drag over the times you are free.</Muted>
            <span aria-live="polite">
              <Muted as="span">
                {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved ✓" : ""}
              </Muted>
            </span>
          </Toolbar>
          <Toolbar>
            <SlotActions>
              <QuietButton
                type="button"
                disabled={isPending}
                onClick={() => {
                  const free = new Set<string>();
                  for (const day of poll.days) {
                    for (const time of times) {
                      const key = cellKey(day, time);
                      if (!busyCells.has(key)) free.add(key);
                    }
                  }
                  setAll(free);
                }}
              >
                {busyCells.size > 0 ? "Mark all times I'm not busy" : "Mark all"}
              </QuietButton>
              <QuietButton
                type="button"
                disabled={isPending || mine.size === 0}
                onClick={() => setAll(new Set())}
              >
                Clear
              </QuietButton>
            </SlotActions>
            <LegendRow>
              <span>
                <Swatch $kind="free" />
                Free
              </span>
              {busyCells.size > 0 && (
                <span>
                  <Swatch $kind="busy" />
                  On your calendar
                </span>
              )}
            </LegendRow>
          </Toolbar>
          {grid("mine")}
          <div>
            <PrimaryButton type="button" onClick={() => setTab("group")}>
              See when everyone can →
            </PrimaryButton>
          </div>
        </Section>
      )}

      {tab === "group" && (
        <>
          <Section>
            <Toolbar>
              <SectionTitle>Best times</SectionTitle>
              {clashing > 0 && (
                <CheckLabel>
                  <input
                    type="checkbox"
                    checked={hideBusy}
                    onChange={(e) => setHideBusy(e.target.checked)}
                  />
                  Hide times I&apos;m busy ({clashing})
                </CheckLabel>
              )}
            </Toolbar>
            {answered === 0 ? (
              <Muted>Nobody has answered yet.</Muted>
            ) : best.length === 0 ? (
              <Muted>No time works yet. Wait for more answers or add your own.</Muted>
            ) : (
              <SlotList>
                {best.map((option) => {
                  const key = cellKey(option.date, option.startTime);
                  const clash = clashFor(option);
                  const everyone = option.busy.length === 0;
                  return (
                    <SlotRow key={key} $mine={everyone}>
                      <SlotTime>
                        {shortDate(option.date)}
                        <br />
                        {option.startTime}–{option.endTime}
                      </SlotTime>
                      <SlotWho>
                        <span>
                          {everyone
                            ? `All ${option.free.length} who answered can`
                            : `${option.free.length} of ${answered} can`}
                        </span>
                        {!everyone && <small>Can&apos;t: {option.busy.join(", ")}</small>}
                        {clash && <small>You have “{clash.title}” then</small>}
                      </SlotWho>
                      <SlotActions>
                        {poll.canManage &&
                          (confirming === key ? (
                            <>
                              <PrimaryButton
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  finish(() =>
                                    schedulePoll(poll.id, option.date, option.startTime)
                                  )
                                }
                              >
                                {isPending ? "Scheduling…" : "Yes, schedule it"}
                              </PrimaryButton>
                              <QuietButton
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirming(null)}
                              >
                                Cancel
                              </QuietButton>
                            </>
                          ) : (
                            <QuietButton
                              type="button"
                              disabled={isPending}
                              aria-label={`Pick ${shortDate(option.date)} ${option.startTime}`}
                              onClick={() => setConfirming(key)}
                            >
                              Pick this time
                            </QuietButton>
                          ))}
                      </SlotActions>
                    </SlotRow>
                  );
                })}
              </SlotList>
            )}
            {poll.canManage && answered > 0 && (
              <Muted>
                Picking a time puts the meeting on everyone&apos;s calendar and
                closes the poll.
              </Muted>
            )}
          </Section>

          <Section>
            <Toolbar>
              <SectionTitle>Who is free when</SectionTitle>
              <LegendRow>
                <span>
                  <Swatch $kind="heat" />
                  Darker = more people free
                </span>
              </LegendRow>
            </Toolbar>
            {grid("group")}
            {!poll.answered && (
              <Notice>
                <span>You have not marked your times yet.</span>
                <QuietButton type="button" onClick={() => setTab("mine")}>
                  Mark my times
                </QuietButton>
              </Notice>
            )}
          </Section>
        </>
      )}

      {error && <FormError role="alert">{error}</FormError>}

      {poll.canManage && (
        <Toolbar>
          <span />
          {confirmDelete ? (
            <span>
              <Muted as="span">Delete the poll and every answer? </Muted>
              <QuietButton
                type="button"
                $danger
                disabled={isPending}
                onClick={() => finish(() => deleteMeetingPoll(poll.id))}
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
              Delete poll
            </QuietButton>
          )}
        </Toolbar>
      )}
    </DialogBody>
  );
};
