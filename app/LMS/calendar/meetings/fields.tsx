"use client";

import { useMemo, useState } from "react";
import type { ShareableUser } from "serverActions/calendarEvents";
import { normalizeTime } from "utils/calendarUtils";
import { MEETING_LENGTHS, lengthLabel } from "utils/meetingUtils";
import { Input } from "UIcomponents/input/Input";
import { Avatar } from "UIcomponents/avatar/Avatar";
import {
  Field,
  FieldLabel,
  NativeSelect,
  PeopleSearch,
  PeoplePicker,
  PersonOption,
  PickedSummary,
  FormError,
} from "../style";

/**
 * A 24-hour time typed as text ("9", "930", "14.30" all work) and tidied to
 * "HH:MM" on leaving the field. Native time inputs follow the browser locale
 * and show AM/PM to many students here.
 */
export const TimeField = ({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: string;
}) => (
  <Input
    id={id}
    type="text"
    label={label}
    inputMode="numeric"
    placeholder="10:00"
    maxLength={5}
    required
    disabled={disabled}
    value={value}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    onBlur={() => onChange(normalizeTime(value))}
    error={error}
  />
);

/** How long each meeting or slot lasts. */
export const LengthField = ({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) => (
  <Field>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <NativeSelect
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {MEETING_LENGTHS.map((minutes) => (
        <option key={minutes} value={minutes}>
          {lengthLabel(minutes)}
        </option>
      ))}
    </NativeSelect>
  </Field>
);

/** Above this many people, a search box is quicker than scrolling. */
const SEARCH_THRESHOLD = 8;

/** Tick the people something is for. */
export const PeopleField = ({
  people,
  picked,
  onChange,
  disabled,
  error,
}: {
  people: ShareableUser[];
  picked: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
  error?: string;
}) => {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) => person.name.toLowerCase().includes(needle));
  }, [people, query]);
  const names = people
    .filter((person) => picked.has(person.id))
    .map((person) => person.name);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <Field>
      {people.length > SEARCH_THRESHOLD && (
        <PeopleSearch
          type="search"
          placeholder="Search by name"
          aria-label="Search people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <PeoplePicker role="group" aria-label="People">
        {visible.map((person) => (
          <PersonOption key={person.id}>
            <input
              type="checkbox"
              checked={picked.has(person.id)}
              disabled={disabled}
              onChange={() => toggle(person.id)}
            />
            <Avatar name={person.name} url={person.avatarUrl} size={20} />
            {person.name}
          </PersonOption>
        ))}
        {visible.length === 0 && <PickedSummary>Nobody by that name.</PickedSummary>}
      </PeoplePicker>
      <PickedSummary>
        {names.length === 0 ? "Nobody picked yet." : names.join(", ")}
      </PickedSummary>
      {error && <FormError role="alert">{error}</FormError>}
    </Field>
  );
};
