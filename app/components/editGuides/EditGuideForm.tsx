"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import {
  TileHead,
  TileIcon,
  TileTitle,
  TileBody,
  TileIconButton,
  SubSectionHeading,
  Eyebrow,
  ToolAnchor,
  ToolLink,
} from "UIcomponents/guideTiles/style";
import {
  DescriptionIcon,
  TopicsIcon,
  GoalsIcon,
  RequirementsIcon,
  MaterialsIcon,
  SubmitIcon,
  ExpandIcon,
} from "UIcomponents/guideTiles/icons";
import { GuideType } from "../../models/guide";
import { MODULE_TITLES } from "../../constants/moduleTitles";
import { getDiscipline, getIsSpecialty, type Discipline } from "../../utils/guideTaxonomy";
import { ExerciseEditor, type ExerciseForm } from "./ExerciseEditor";
import { FocusMode } from "./FocusMode";
import {
  buildGuidePayload,
  exerciseFromGuide,
  formFromGuide,
  validateExercise,
  validateForm,
  type GradingMode,
  type GuideForm,
} from "./editGuidePayload";
import {
  EditorShell,
  EditorHeader,
  EditorTitleBlock,
  TitleInput,
  HeaderActions,
  StatusMessage,
  SettingsStrip,
  SettingField,
  SettingCheck,
  TileGrid,
  EditTile,
  TileHint,
  TileEditor,
  ListRow,
  RowFields,
  RowRemove,
  RowAdd,
  Input,
  Select,
  MarkdownEditorWrapper,
  Button,
} from "./styles.EditGuideForm";

/**
 * The server's validation problems, in the teacher's words: the first few,
 * with "exercise.tasks.3.helpLinks.0.url" read out as "question 4 → help
 * link 1 → url". Without this a rejected save was a dead end.
 */
export const describeSaveFailure = (issues?: Array<{ path: string; message: string }>) => {
  if (!issues || issues.length === 0) {
    return "The guide could not be saved. Check the fields and try again.";
  }
  const where = (path: string) =>
    path
      .replace(/^exercise\.tasks\.(\d+)/, (_, n) => `question ${Number(n) + 1}`)
      .replace(/\.helpLinks\.(\d+)/, (_, n) => ` → help link ${Number(n) + 1}`)
      .replace(/\.(\d+)/g, (_, n) => ` ${Number(n) + 1}`)
      .replace(/\./g, " → ");
  const shown = issues.slice(0, 3).map((issue) =>
    issue.path ? `${where(issue.path)}: ${issue.message}` : issue.message
  );
  const more = issues.length > 3 ? ` (and ${issues.length - 3} more)` : "";
  return `The guide could not be saved. ${shown.join("; ")}${more}.`;
};

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface EditGuideFormProps {
  guide: GuideType;
}

/** The long texts a teacher can open on their own, full screen. */
type FocusField = "description" | "topics" | "requirements";

const FOCUS_TITLES: Record<FocusField, string> = {
  description: "Description",
  topics: "Topics",
  requirements: "Idea for return",
};

/**
 * The guide editor, laid out as the guide page's board: the same tiles in
 * the same places, each opened up for editing, so what a teacher changes
 * is what a student reads. Tiles stay put — arranging is a reading
 * preference, not an authoring one — and any long text can be expanded to
 * full screen with a live preview beside it.
 */
export const EditGuideForm = ({ guide }: EditGuideFormProps) => {
  const router = useRouter();
  const [form, setForm] = useState<GuideForm>(() => formFromGuide(guide));
  const [exercise, setExercise] = useState<ExerciseForm>(() => exerciseFromGuide(guide));
  const [gradingMode, setGradingMode] = useState<GradingMode>(
    guide.gradingMode === "auto" ? "auto" : "peerReview"
  );
  const [discipline, setDiscipline] = useState<Discipline>(getDiscipline(guide));
  const [isSpecialty, setIsSpecialty] = useState<boolean>(getIsSpecialty(guide));
  const [saving, setSaving] = useState(false);
  // What the last save or check said, under the title instead of an alert.
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  const [focus, setFocus] = useState<FocusField | null>(null);

  // Everything typed into this form, so a reload mid-edit costs nothing.
  const draft = useFormDraft(
    // Versioned: a draft saved by the editor before hand-authored tasks were
    // carried through untouched held them as empty quiz questions, and
    // restoring it made every save fail. Old drafts are simply not read.
    `edit-guide:v2:${guide._id}`,
    { form, exercise, gradingMode, discipline, isSpecialty },
    (saved) => {
      setForm(saved.form);
      setExercise(saved.exercise);
      setGradingMode(saved.gradingMode);
      setDiscipline(saved.discipline);
      setIsSpecialty(saved.isSpecialty);
    }
  );

  const patch = (changes: Partial<GuideForm>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  const setList = <K extends "knowledge" | "skills" | "resources" | "classes" | "references">(
    key: K,
    next: GuideForm[K]
  ) => patch({ [key]: next } as Partial<GuideForm>);

  const closeFocus = useCallback(() => setFocus(null), []);

  const focusValue: Record<FocusField, string> = {
    description: form.description,
    topics: form.topicsList,
    requirements: form.themeIdea.description,
  };
  const setFocusValue = (field: FocusField, value: string) => {
    if (field === "description") patch({ description: value });
    else if (field === "topics") patch({ topicsList: value });
    else patch({ themeIdea: { ...form.themeIdea, description: value } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(undefined);

    const problem =
      validateForm(form) ?? (gradingMode === "auto" ? validateExercise(exercise) : null);
    if (problem) {
      setStatus({ ok: false, text: problem });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/guides/${guide._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildGuidePayload(form, exercise, gradingMode, discipline, isSpecialty),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Stay on the page: a save is not the end of editing.
        draft.clear();
        const { shifted = 0 } = (await response.json().catch(() => ({}))) as { shifted?: number };
        setStatus({
          ok: true,
          text:
            shifted > 0
              ? `Saved. ${shifted === 1 ? "One other guide" : `${shifted} other guides`} in the module moved to make room for #${form.order}.`
              : "Saved. Students see the change straight away.",
        });
        router.refresh();
      } else {
        const body = (await response.json().catch(() => null)) as {
          issues?: Array<{ path: string; message: string }>;
        } | null;
        setStatus({ ok: false, text: describeSaveFailure(body?.issues) });
      }
    } catch (error) {
      console.error("Error saving guide:", error);
      setStatus({
        ok: false,
        text: "The guide could not be saved. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const knowledgeGoals = form.knowledge.filter((k) => k.trim());

  return (
    <EditorShell as="form" onSubmit={handleSubmit}>
      <EditorHeader>
        <EditorTitleBlock>
          <Eyebrow>Editing · {form.moduleTitle || "no module yet"}</Eyebrow>
          <TitleInput
            aria-label="Guide title"
            value={form.title}
            placeholder="Guide title"
            onChange={(e) => patch({ title: e.target.value })}
            required
          />
        </EditorTitleBlock>
        <HeaderActions>
          <ToolLink href="/LMS/edit-guides">All guides</ToolLink>
          <ToolAnchor href={`/guides/${guide._id}`} target="_blank" rel="noopener noreferrer">
            View as student ↗
          </ToolAnchor>
          <Button type="submit" $variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </HeaderActions>
      </EditorHeader>

      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      {status && (
        <StatusMessage role={status.ok ? "status" : "alert"} $error={!status.ok} style={{ margin: 0 }}>
          {status.text}
        </StatusMessage>
      )}

      <SettingsStrip>
        <SettingField>
          Module
          <Select
            value={form.moduleTitle}
            onChange={(e) => patch({ moduleTitle: e.target.value })}
            required
          >
            <option value="">Pick a module</option>
            {MODULE_TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </Select>
        </SettingField>
        <SettingField style={{ minWidth: "5rem" }}>
          Order
          <Input
            type="number"
            value={form.order}
            onChange={(e) => patch({ order: parseInt(e.target.value) || 0 })}
            required
          />
        </SettingField>
        <SettingField>
          Discipline
          <Select value={discipline} onChange={(e) => setDiscipline(e.target.value as Discipline)}>
            <option value="code">Code</option>
            <option value="design">Design</option>
          </Select>
        </SettingField>
        <SettingField style={{ minWidth: "14rem" }}>
          How it is completed
          <Select
            value={gradingMode}
            onChange={(e) => setGradingMode(e.target.value as GradingMode)}
          >
            <option value="peerReview">Peer review — return a project</option>
            <option value="auto">Auto-graded exercise</option>
          </Select>
        </SettingField>
        <SettingCheck>
          <input
            type="checkbox"
            checked={isSpecialty}
            onChange={(e) => setIsSpecialty(e.target.checked)}
          />
          Speciality guide (optional; can replace a lower grade in the same discipline)
        </SettingCheck>
      </SettingsStrip>

      <TileGrid>
        <Tile
          label="Description"
          accent="violet"
          icon={<DescriptionIcon />}
          tall
          onExpand={() => setFocus("description")}
        >
          <Markdown
            value={form.description}
            onChange={(value) => patch({ description: value })}
          />
        </Tile>

        <Tile
          label="Idea for return"
          accent="amber"
          icon={<RequirementsIcon />}
          tall
          onExpand={() => setFocus("requirements")}
        >
          <SubSectionHeading>Idea title</SubSectionHeading>
          <Input
            aria-label="Idea title"
            value={form.themeIdea.title}
            placeholder="e.g. A landing page for a café"
            onChange={(e) => patch({ themeIdea: { ...form.themeIdea, title: e.target.value } })}
            style={{ marginBottom: "0.75rem" }}
          />
          <TileHint>
            Prefilled as the project title when a student returns; they may
            hand in anything that meets the goals.
          </TileHint>
          <Markdown
            value={form.themeIdea.description}
            onChange={(value) => patch({ themeIdea: { ...form.themeIdea, description: value } })}
          />
        </Tile>

        <Tile
          label="Topics"
          accent="blue"
          icon={<TopicsIcon />}
          onExpand={() => setFocus("topics")}
        >
          <Markdown value={form.topicsList} onChange={(value) => patch({ topicsList: value })} />
        </Tile>

        <Tile label="Goals" accent="teal" icon={<GoalsIcon />}>
          <SubSectionHeading>Knowledge</SubSectionHeading>
          <StringList
            items={form.knowledge}
            placeholder="What the student will know"
            addLabel="+ Knowledge goal"
            onChange={(next) => setList("knowledge", next)}
          />
          <SubSectionHeading>Skills</SubSectionHeading>
          <StringList
            items={form.skills}
            placeholder="What the student will be able to do"
            addLabel="+ Skill"
            onChange={(next) => setList("skills", next)}
          />
        </Tile>

        <Tile label="Materials" accent="rose" icon={<MaterialsIcon />} span={2}>
          <TileHint>
            Shown as one reading list, in this order. A row with no link is dropped on save.
          </TileHint>
          <SubSectionHeading>Resources</SubSectionHeading>
          <RowList
            rows={form.resources}
            fields={[
              { key: "description", placeholder: "What it is" },
              { key: "link", placeholder: "https://…", type: "url" },
            ]}
            addLabel="+ Resource"
            onChange={(next) => setList("resources", next)}
          />
          <SubSectionHeading>Classes and lecture materials</SubSectionHeading>
          <RowList
            rows={form.classes}
            fields={[
              { key: "title", placeholder: "Title" },
              { key: "link", placeholder: "https://…", type: "url" },
            ]}
            addLabel="+ Class material"
            onChange={(next) => setList("classes", next)}
          />
          <SubSectionHeading>References</SubSectionHeading>
          <RowList
            rows={form.references}
            fields={[
              {
                key: "type",
                placeholder: "Type",
                options: ["Class", "Resource", "Article", "Video", "Documentation"],
              },
              { key: "name", placeholder: "Name" },
              { key: "link", placeholder: "https://…", type: "url" },
            ]}
            addLabel="+ Reference"
            onChange={(next) => setList("references", next)}
          />
        </Tile>

        {gradingMode === "auto" && (
          <Tile label="Exercise" accent="green" icon={<SubmitIcon />} span={2} tall>
            <ExerciseEditor
              value={exercise}
              onChange={setExercise}
              knowledgeGoals={knowledgeGoals}
            />
          </Tile>
        )}
      </TileGrid>

      {focus && (
        <FocusMode
          title={FOCUS_TITLES[focus]}
          value={focusValue[focus]}
          onChange={(value) => setFocusValue(focus, value)}
          onClose={closeFocus}
        />
      )}
    </EditorShell>
  );
};

// ── Pieces ────────────────────────────────────────────────────────────────

const Tile = ({
  label,
  accent,
  icon,
  span,
  tall,
  onExpand,
  children,
}: {
  label: string;
  accent: string;
  icon: React.ReactNode;
  span?: 1 | 2;
  tall?: boolean;
  /** Present on tiles whose text can be opened full screen. */
  onExpand?: () => void;
  children: React.ReactNode;
}) => (
  <EditTile $span={span} $tall={tall} aria-label={label}>
    <TileHead>
      <TileIcon $accent={accent}>{icon}</TileIcon>
      <TileTitle>{label}</TileTitle>
      {onExpand && (
        <TileIconButton
          type="button"
          aria-label={`Open ${label} full screen`}
          title="Full screen"
          onClick={onExpand}
        >
          <ExpandIcon />
        </TileIconButton>
      )}
    </TileHead>
    <TileBody>{children}</TileBody>
  </EditTile>
);

const Markdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <TileEditor>
    <MarkdownEditorWrapper
      data-color-mode="light"
      style={{ flex: 1, minHeight: "12rem", display: "flex", flexDirection: "column" }}
    >
      <MDEditor
        value={value}
        onChange={(next) => onChange(next || "")}
        preview="edit"
        height="100%"
        visibleDragbar={false}
      />
    </MarkdownEditorWrapper>
  </TileEditor>
);

const StringList = ({
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (next: string[]) => void;
}) => (
  <div>
    {items.map((item, index) => (
      // Position, not text: two goals can read the same while being typed.
      <ListRow key={index}>
        <Input
          value={item}
          placeholder={placeholder}
          onChange={(e) => onChange(items.map((v, i) => (i === index ? e.target.value : v)))}
        />
        <RowRemove type="button" onClick={() => onChange(items.filter((_, i) => i !== index))}>
          Remove
        </RowRemove>
      </ListRow>
    ))}
    <RowAdd type="button" onClick={() => onChange([...items, ""])}>
      {addLabel}
    </RowAdd>
  </div>
);

type RowField<T> = {
  key: keyof T & string;
  placeholder: string;
  type?: "url" | "text";
  /** A select instead of a text input. */
  options?: string[];
};

function RowList<T extends Record<string, string>>({
  rows,
  fields,
  addLabel,
  onChange,
}: {
  rows: T[];
  fields: RowField<T>[];
  addLabel: string;
  onChange: (next: T[]) => void;
}) {
  const blank = Object.fromEntries(fields.map((f) => [f.key, ""])) as T;
  return (
    <div>
      {rows.map((row, index) => (
        <ListRow key={index}>
          <RowFields style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
            {fields.map((field) =>
              field.options ? (
                <Select
                  key={field.key}
                  aria-label={field.placeholder}
                  value={row[field.key]}
                  style={{ padding: "0.45rem 0.6rem", fontSize: "var(--text-sm)" }}
                  onChange={(e) =>
                    onChange(rows.map((r, i) => (i === index ? { ...r, [field.key]: e.target.value } : r)))
                  }
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  key={field.key}
                  aria-label={field.placeholder}
                  type={field.type ?? "text"}
                  value={row[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    onChange(rows.map((r, i) => (i === index ? { ...r, [field.key]: e.target.value } : r)))
                  }
                />
              )
            )}
          </RowFields>
          <RowRemove type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            Remove
          </RowRemove>
        </ListRow>
      ))}
      <RowAdd type="button" onClick={() => onChange([...rows, blank])}>
        {addLabel}
      </RowAdd>
    </div>
  );
}
