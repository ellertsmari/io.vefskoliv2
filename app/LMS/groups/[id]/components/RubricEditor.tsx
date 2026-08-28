"use client";
import { useState } from "react";
import styled from "styled-components";
import {
  DISCIPLINE_META,
  RubricDiscipline,
  RubricItem,
  rubricForProject,
  rubricKeyFromTitle,
} from "constants/groupWork";
import {
  MODULES_WITH_PRESET,
  rubricPresetForModule,
} from "constants/groupRubrics";
import { getRubricLibrary } from "serverActions/groups/getRubricLibrary";
import { RubricSource } from "types/groupTypes";
import {
  Card,
  SectionTitle,
  MutedText,
  Input,
  SecondaryButton,
  SelectableChip,
  ChipRow,
  Message,
} from "../../styles";

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Row = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--primary-black-10);
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: var(--radius-md);
`;

const RowTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RowIndex = styled.span`
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--primary-black-60);
  font-variant-numeric: tabular-nums;
  min-width: 1.5rem;
`;

const IconButton = styled.button`
  border: 1px solid var(--primary-black-10);
  background: white;
  border-radius: var(--radius-md);
  width: 1.9rem;
  height: 1.9rem;
  line-height: 1;
  cursor: pointer;
  font-size: var(--text-sm);

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

const RemoveButton = styled(IconButton)`
  color: #c92a2a;
  border-color: #ffc9c9;
`;

const KeyHint = styled.code`
  font-size: var(--text-xs, 0.75rem);
  color: var(--primary-black-60);
  align-self: flex-start;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;

const SourceSelect = styled.select`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.4rem 0.5rem;
  font-size: var(--text-sm);
  background: white;
  max-width: 22rem;
`;

const DISCIPLINES: RubricDiscipline[] = ["design", "code", "general"];

export const RubricEditor = ({
  projectId,
  module,
  rubric,
  savedKeys,
  locked,
  onChange,
}: {
  projectId: string;
  module: number | null;
  rubric: RubricItem[];
  /**
   * Keys already stored on the project. A row that is not among them has
   * never been evaluated, so its key can still follow its title; a saved
   * row's key is frozen because TeamEvaluation documents point at it.
   */
  savedKeys: string[];
  /** True once the project has been evaluated — wording edits only. */
  locked: boolean;
  onChange: (rubric: RubricItem[]) => void;
}) => {
  const [library, setLibrary] = useState<RubricSource[] | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const saved = new Set(savedKeys);

  const update = (index: number, patch: Partial<RubricItem>) =>
    onChange(
      rubric.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  /**
   * Re-slug an unsaved row's key from its title once the teacher leaves the
   * field. Doing it per keystroke would churn the key (and any collision
   * suffix) through every half-typed word.
   */
  const syncKey = (index: number) => {
    const item = rubric[index];
    if (saved.has(item.key)) return;
    const taken = rubric.filter((_, i) => i !== index).map((entry) => entry.key);
    const key = rubricKeyFromTitle(item.title, taken);
    if (key !== item.key) update(index, { key });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rubric.length) return;
    const next = [...rubric];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addRow = () =>
    onChange([
      ...rubric,
      {
        key: rubricKeyFromTitle(
          "",
          rubric.map((item) => item.key)
        ),
        title: "",
        description: "",
        discipline: "general",
      },
    ]);

  const removeRow = (index: number) =>
    onChange(rubric.filter((_, i) => i !== index));

  // Replacing wholesale throws away whatever is in the form, so ask first
  // whenever there is something to lose.
  const replaceAll = (next: RubricItem[]) => {
    if (
      rubric.length > 0 &&
      !window.confirm(
        `Replace the ${rubric.length} row${rubric.length === 1 ? "" : "s"} below with these ${next.length}?`
      )
    ) {
      return;
    }
    onChange(next.map((item) => ({ ...item })));
  };

  const loadLibrary = async () => {
    if (library || loadingLibrary) return;
    setLoadingLibrary(true);
    setLibrary(await getRubricLibrary(projectId));
    setLoadingLibrary(false);
  };

  const preset = rubricPresetForModule(module);

  return (
    <Card>
      <SectionTitle>Rubric</SectionTitle>
      <MutedText>
        Every row becomes one 0–10 category in the team evaluation. The colour
        is the discipline — judges invited for design or coding only have to
        score their own rows plus the presentation ones.
      </MutedText>

      {locked ? (
        <Message>
          This project has already been evaluated. Titles, descriptions and
          disciplines are still editable, but rows can no longer be added,
          removed or reordered into different keys — stored scores point at
          them.
        </Message>
      ) : (
        <Toolbar>
          {preset && (
            <SecondaryButton
              type="button"
              onClick={() => replaceAll(preset)}
              title={`The ${preset.length} rows from the Module ${module} project description`}
            >
              Load Module {module} preset
            </SecondaryButton>
          )}
          <SecondaryButton
            type="button"
            onClick={loadLibrary}
            disabled={loadingLibrary || library !== null}
          >
            {loadingLibrary ? "Loading…" : "Copy from another project"}
          </SecondaryButton>
          {library !== null &&
            (library.length > 0 ? (
              <SourceSelect
                aria-label="Copy a rubric from another project"
                defaultValue=""
                onChange={(event) => {
                  const source = library.find(
                    (entry) => entry._id === event.target.value
                  );
                  event.target.value = "";
                  if (source) replaceAll(source.rubric);
                }}
              >
                <option value="">Pick a project…</option>
                {library.map((source) => (
                  <option key={source._id} value={source._id}>
                    {source.title} ({source.rubric.length} rows)
                  </option>
                ))}
              </SourceSelect>
            ) : (
              <MutedText>No other project has a rubric yet.</MutedText>
            ))}
        </Toolbar>
      )}

      {!preset && !locked && MODULES_WITH_PRESET.length > 0 && (
        <MutedText>
          Pick a module above to load its rubric from the project description.
        </MutedText>
      )}

      <Rows>
        {rubric.map((item, index) => {
          const meta = DISCIPLINE_META[item.discipline ?? "general"];
          return (
            // Index as the React key: an unsaved row's `key` follows its
            // title, so keying on it would remount the input mid-edit.
            <Row key={index} $color={meta.color}>
              <RowTop>
                <RowIndex>{index + 1}.</RowIndex>
                <Input
                  value={item.title}
                  placeholder="Row title, e.g. Live coding — clarity"
                  aria-label={`Rubric row ${index + 1} title`}
                  onChange={(event) =>
                    update(index, { title: event.target.value })
                  }
                  onBlur={() => syncKey(index)}
                  required
                />
                {!locked && (
                  <>
                    <IconButton
                      type="button"
                      aria-label={`Move "${item.title || "row"}" up`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      type="button"
                      aria-label={`Move "${item.title || "row"}" down`}
                      disabled={index === rubric.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </IconButton>
                    <RemoveButton
                      type="button"
                      aria-label={`Remove "${item.title || "row"}"`}
                      onClick={() => removeRow(index)}
                    >
                      ✕
                    </RemoveButton>
                  </>
                )}
              </RowTop>
              <Input
                value={item.description}
                placeholder="What the evaluator should look for"
                aria-label={`Rubric row ${index + 1} description`}
                onChange={(event) =>
                  update(index, { description: event.target.value })
                }
              />
              <ChipRow>
                {DISCIPLINES.map((discipline) => (
                  <SelectableChip
                    key={discipline}
                    type="button"
                    $selected={(item.discipline ?? "general") === discipline}
                    onClick={() => update(index, { discipline })}
                  >
                    {DISCIPLINE_META[discipline].label}
                  </SelectableChip>
                ))}
              </ChipRow>
              <KeyHint>{item.key}</KeyHint>
            </Row>
          );
        })}
      </Rows>

      {!locked && (
        <div>
          <SecondaryButton type="button" onClick={addRow}>
            Add row
          </SecondaryButton>
        </div>
      )}
    </Card>
  );
};

/** The rows the editor starts from — the project's own rubric, or the default. */
export const initialRubric = (rubric: RubricItem[]): RubricItem[] =>
  rubricForProject(rubric).map((item) => ({
    ...item,
    description: item.description || "",
    discipline: item.discipline ?? "general",
  }));
