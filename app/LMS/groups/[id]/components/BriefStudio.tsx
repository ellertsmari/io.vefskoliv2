"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { BriefProject, GroupProjectDetails, SerializedBrief } from "types/groupTypes";
import {
  BRIEF_ANIMATIONS,
  BRIEF_COLOR_FIELDS,
  BRIEF_FONT_SUGGESTIONS,
  BRIEF_SLUG,
  BRIEF_SNIPPETS,
  BriefSectionKey,
  BriefTheme,
  DEFAULT_BRIEF_THEME,
  FONT_FAMILY,
  HEX_COLOR,
  briefSectionMeta,
  defaultBriefSlug,
} from "constants/projectBrief";
import {
  importLegacyBrief,
  saveBriefLook,
  saveBriefSection,
  setBriefPublishing,
} from "serverActions/groups/manageBrief";
import { BriefView } from "../../../../projects/components/BriefView";
import {
  Card,
  Input,
  Label,
  Message,
  MutedText,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  TextArea,
} from "../../styles";

/**
 * The teachers' brief editor: the page exactly as students and the public
 * see it, with an Edit button on every section and on the cover. Editing
 * opens a drawer beside the page, and the page updates as you type, so there
 * is no separate preview to keep in sync. Each part saves on its own.
 */

type Editing =
  | { kind: "section"; key: BriefSectionKey; title: string; html: string }
  | {
      kind: "look";
      tagline: string;
      teamSize: string;
      coverImage: string;
      theme: BriefTheme;
    };

type Sanitize = (html: string) => string;

export const BriefStudio = ({ details }: { details: GroupProjectDetails }) => {
  const router = useRouter();
  const { project } = details;
  const [brief, setBrief] = useState<SerializedBrief>(project.brief);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The sanitiser runs in the browser for the live preview, so a pasted
  // <script> never runs here either. Loaded on first edit, not for students.
  const [sanitize, setSanitize] = useState<Sanitize | null>(null);
  useEffect(() => {
    if (!editing || sanitize) return;
    import("utils/briefHtml").then((mod) => setSanitize(() => mod.sanitizeBriefHtml));
  }, [editing, sanitize]);

  // Debounced so the page does not re-parse on every keystroke.
  const [previewHtml, setPreviewHtml] = useState("");
  const editingHtml = editing?.kind === "section" ? editing.html : null;
  useEffect(() => {
    if (editingHtml === null || !sanitize) return;
    const timer = setTimeout(() => setPreviewHtml(sanitize(editingHtml)), 200);
    return () => clearTimeout(timer);
  }, [editingHtml, sanitize]);

  /** The brief with the open edit applied — what the page shows. */
  const shown: SerializedBrief = useMemo(() => {
    if (!editing) return brief;
    if (editing.kind === "look") {
      return {
        ...brief,
        tagline: editing.tagline,
        teamSize: editing.teamSize,
        coverImage: /^https:\/\//.test(editing.coverImage) ? editing.coverImage : "",
        theme: {
          ...editing.theme,
          ...Object.fromEntries(
            Object.entries(editing.theme).filter(([key, value]) =>
              key.endsWith("Font") ? !FONT_FAMILY.test(value) : !HEX_COLOR.test(value)
            ).map(([key]) => [key, brief.theme[key as keyof BriefTheme]])
          ),
        },
      };
    }
    const others = brief.sections.filter((s) => s.key !== editing.key);
    return {
      ...brief,
      sections: [...others, { key: editing.key, title: editing.title, html: previewHtml }],
    };
  }, [brief, editing, previewHtml]);

  const view: BriefProject = { ...project, brief: shown };

  const openSection = (key: BriefSectionKey) => {
    const stored = brief.sections.find((s) => s.key === key);
    setError(null);
    setPreviewHtml(stored?.html ?? "");
    setEditing({ kind: "section", key, title: stored?.title ?? "", html: stored?.html ?? "" });
    // After the page has narrowed for the drawer, or it scrolls to where the
    // section used to be.
    setTimeout(
      () =>
        document
          .getElementById(`brief-${key}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      400
    );
  };

  const openLook = () => {
    setError(null);
    setEditing({
      kind: "look",
      tagline: brief.tagline,
      teamSize: brief.teamSize,
      coverImage: brief.coverImage,
      theme: { ...brief.theme },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const result =
      editing.kind === "section"
        ? await saveBriefSection({
            projectId: project._id,
            key: editing.key,
            title: editing.title,
            html: editing.html,
          })
        : await saveBriefLook({
            projectId: project._id,
            tagline: editing.tagline,
            teamSize: editing.teamSize,
            coverImage: editing.coverImage,
            theme: editing.theme,
          });
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Could not save");
      return;
    }
    setBrief(result.data);
    setEditing(null);
    router.refresh();
  };

  const hasSections = brief.sections.some((s) => s.html.trim());

  return (
    <Studio $drawer={!!editing}>
      <PublishingPanel details={details} />

      {!hasSections && project.description.trim() && (
        <ImportCard details={details} onImported={setBrief} />
      )}

      <BriefView
        project={view}
        embedded
        onEditSection={openSection}
        onEditLook={openLook}
      />

      {editing &&
        createPortal(
          <Drawer
            editing={editing}
            onChange={setEditing}
            onCancel={() => setEditing(null)}
            onSave={save}
            saving={saving}
            error={error}
          />,
          document.body
        )}
    </Studio>
  );
};

/* --------------------------- Publishing --------------------------- */

const PublishingPanel = ({ details }: { details: GroupProjectDetails }) => {
  const router = useRouter();
  const { project } = details;
  const [published, setPublished] = useState(project.published);
  const [slug, setSlug] = useState(
    project.slug || defaultBriefSlug(project.title, project.module)
  );
  const [savedSlug, setSavedSlug] = useState(project.slug);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async (nextPublished: boolean) => {
    if (!BRIEF_SLUG.test(slug)) {
      setMessage({ text: "Use lowercase letters, numbers and dashes", error: true });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await setBriefPublishing({
      projectId: project._id,
      published: nextPublished,
      slug,
    });
    setBusy(false);
    if (!result.success) {
      setMessage({ text: result.message ?? "Could not save", error: true });
      return;
    }
    setPublished(result.data.published);
    setSavedSlug(result.data.slug);
    setMessage({ text: result.data.published ? "Published" : "Saved", error: false });
    router.refresh();
  };

  const live = published && project.status !== "formation";
  const pageUrl = savedSlug ? `/projects/${savedSlug}` : null;

  return (
    <Card>
      <PublishRow>
        <div>
          <SectionTitle>Public page</SectionTitle>
          <MutedText>
            {live
              ? "Live — anyone can read this brief, and search engines index it."
              : published
                ? "Published, and goes live once teams are formed — until then the brief stays the reward for answering the preferences form."
                : "Not published. Only teachers can open the page."}
          </MutedText>
        </div>
        <StatusDot $live={live} aria-hidden />
      </PublishRow>
      <PublishRow>
        <SlugLabel>
          io.vefskoli.is/projects/
          <Input
            value={slug}
            aria-label="Page address"
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
          />
        </SlugLabel>
        {slug !== savedSlug && savedSlug && (
          <SecondaryButton type="button" disabled={busy} onClick={() => apply(published)}>
            Save address
          </SecondaryButton>
        )}
        <PrimaryButton type="button" disabled={busy} onClick={() => apply(!published)}>
          {published ? "Unpublish" : "Publish"}
        </PrimaryButton>
        {pageUrl && (
          <SecondaryButton as="a" href={pageUrl} target="_blank" rel="noopener">
            <Icon icon="mdi:open-in-new" aria-hidden /> {live ? "Open page" : "Preview page"}
          </SecondaryButton>
        )}
        {message && <Message $error={message.error}>{message.text}</Message>}
      </PublishRow>
    </Card>
  );
};

const ImportCard = ({
  details,
  onImported,
}: {
  details: GroupProjectDetails;
  onImported: (brief: SerializedBrief) => void;
}) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Callout>
      <Icon icon="mdi:auto-fix" aria-hidden />
      <div>
        <strong>This project still has its old one-block description.</strong>
        <MutedText>
          Split it into the sections below — intro, requirements, ideas,
          presentation — and pick up the team size. Only empty sections are
          filled, so nothing you have written is overwritten. Check each
          section afterwards.
        </MutedText>
        {error && <Message $error>{error}</Message>}
      </div>
      <PrimaryButton
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await importLegacyBrief(details.project._id);
          setBusy(false);
          if (!result.success) {
            setError(result.message ?? "Import failed");
            return;
          }
          onImported(result.data);
          router.refresh();
        }}
      >
        {busy ? "Importing…" : "Import"}
      </PrimaryButton>
    </Callout>
  );
};

/* ----------------------------- Drawer ----------------------------- */

const Drawer = ({
  editing,
  onChange,
  onCancel,
  onSave,
  saving,
  error,
}: {
  editing: Editing;
  onChange: (next: Editing) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const initial = useRef(JSON.stringify(editing));
  const dirty = JSON.stringify(editing) !== initial.current;

  const cancel = () => {
    if (dirty && !window.confirm("Discard your changes to this part?")) return;
    onCancel();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const insert = (snippet: string) => {
    if (editing.kind !== "section") return;
    const el = textRef.current;
    const start = el?.selectionStart ?? editing.html.length;
    const end = el?.selectionEnd ?? editing.html.length;
    const before = editing.html.slice(0, start);
    const glue = before && !before.endsWith("\n") ? "\n" : "";
    const html = before + glue + snippet + "\n" + editing.html.slice(end);
    onChange({ ...editing, html });
    requestAnimationFrame(() => {
      el?.focus();
      const caret = (before + glue + snippet).length;
      el?.setSelectionRange(caret, caret);
    });
  };

  return (
    <DrawerPanel role="dialog" aria-label="Edit brief">
      <DrawerHead>
        <div>
          <DrawerEyebrow>Editing</DrawerEyebrow>
          <DrawerTitle>
            {editing.kind === "section"
              ? briefSectionMeta(editing.key).defaultTitle
              : "Cover & theme"}
          </DrawerTitle>
        </div>
        <CloseButton type="button" onClick={cancel} aria-label="Close">
          <Icon icon="mdi:close" />
        </CloseButton>
      </DrawerHead>

      <DrawerBody>
        {editing.kind === "section" ? (
          <>
            <Label>
              Title
              <Input
                value={editing.title}
                placeholder={briefSectionMeta(editing.key).defaultTitle}
                onChange={(e) => onChange({ ...editing, title: e.target.value })}
              />
            </Label>
            <MutedText>{briefSectionMeta(editing.key).hint}</MutedText>
            <Label as="div">
              HTML
              <CodeArea
                ref={textRef}
                value={editing.html}
                spellCheck={false}
                aria-label="Section HTML"
                placeholder="<p>Write HTML here — or start from a block below.</p>"
                onChange={(e) => onChange({ ...editing, html: e.target.value })}
              />
            </Label>
            <div>
              <DrawerEyebrow as="p">Insert a block</DrawerEyebrow>
              <Snippets>
                {BRIEF_SNIPPETS.map((snippet) => (
                  <SnippetButton
                    key={snippet.label}
                    type="button"
                    title={snippet.note}
                    onClick={() => insert(snippet.html)}
                  >
                    {snippet.label}
                  </SnippetButton>
                ))}
              </Snippets>
            </div>
            <Cheats>
              <summary>Animations & what is allowed</summary>
              <p>
                Add <code>data-animate</code> to any element:{" "}
                {BRIEF_ANIMATIONS.map((name) => (
                  <code key={name}>{name}</code>
                ))}
                . <code>data-delay=&quot;200&quot;</code> waits that many
                milliseconds; <code>data-stagger</code> on a parent brings its
                children in one by one; <code>data-count=&quot;42&quot;</code>{" "}
                counts a number up; <code>data-parallax=&quot;0.15&quot;</code>{" "}
                drifts with the scroll.
              </p>
              <p>
                Any HTML, <code>style</code> attributes and{" "}
                <code>&lt;style&gt;</code> blocks work, as do images, video and
                iframes (YouTube, Vimeo, Figma, CodePen…). Scripts and{" "}
                <code>on…=</code> handlers are removed on save, because the page
                runs on our own domain.
              </p>
            </Cheats>
          </>
        ) : (
          <LookFields editing={editing} onChange={onChange} />
        )}
      </DrawerBody>

      <DrawerFoot>
        {error && <Message $error>{error}</Message>}
        <SecondaryButton type="button" onClick={cancel}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </PrimaryButton>
      </DrawerFoot>
    </DrawerPanel>
  );
};

const LookFields = ({
  editing,
  onChange,
}: {
  editing: Extract<Editing, { kind: "look" }>;
  onChange: (next: Editing) => void;
}) => {
  const setTheme = (key: keyof BriefTheme, value: string) =>
    onChange({ ...editing, theme: { ...editing.theme, [key]: value } });
  return (
    <>
      <Label>
        Tagline
        <TextArea
          style={{ minHeight: "70px" }}
          value={editing.tagline}
          maxLength={300}
          placeholder="One line under the title"
          onChange={(e) => onChange({ ...editing, tagline: e.target.value })}
        />
      </Label>
      <Label>
        Team size
        <Input
          value={editing.teamSize}
          placeholder="4–5 students"
          maxLength={60}
          onChange={(e) => onChange({ ...editing, teamSize: e.target.value })}
        />
      </Label>
      <Label>
        Cover image (https:// address)
        <Input
          value={editing.coverImage}
          placeholder="https://…"
          onChange={(e) => onChange({ ...editing, coverImage: e.target.value.trim() })}
        />
      </Label>

      <DrawerEyebrow as="p">Colours</DrawerEyebrow>
      <ColorGrid>
        {BRIEF_COLOR_FIELDS.map(({ key, label }) => (
          <ColorField key={key}>
            <input
              type="color"
              aria-label={label}
              value={HEX_COLOR.test(editing.theme[key]) ? editing.theme[key] : DEFAULT_BRIEF_THEME[key]}
              onChange={(e) => setTheme(key, e.target.value)}
            />
            <span>
              {label}
              <HexInput
                value={editing.theme[key]}
                aria-label={`${label} hex`}
                $invalid={!HEX_COLOR.test(editing.theme[key])}
                onChange={(e) => setTheme(key, e.target.value.trim())}
              />
            </span>
          </ColorField>
        ))}
      </ColorGrid>

      <DrawerEyebrow as="p">Typefaces</DrawerEyebrow>
      <MutedText>Any Google Fonts family name.</MutedText>
      <datalist id="brief-fonts">
        {BRIEF_FONT_SUGGESTIONS.map((font) => (
          <option key={font} value={font} />
        ))}
      </datalist>
      <Label>
        Headings
        <Input
          list="brief-fonts"
          value={editing.theme.headingFont}
          onChange={(e) => setTheme("headingFont", e.target.value)}
        />
      </Label>
      <Label>
        Body text
        <Input
          list="brief-fonts"
          value={editing.theme.bodyFont}
          onChange={(e) => setTheme("bodyFont", e.target.value)}
        />
      </Label>
      <div>
        <SecondaryButton
          type="button"
          onClick={() => onChange({ ...editing, theme: { ...DEFAULT_BRIEF_THEME } })}
        >
          Reset to the default theme
        </SecondaryButton>
      </div>
    </>
  );
};

/* ----------------------------- styles ----------------------------- */

const DRAWER = "min(30rem, 100vw)";

const Studio = styled.div<{ $drawer: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: margin-right 0.35s cubic-bezier(0.22, 1, 0.36, 1);

  @media (min-width: 1100px) {
    margin-right: ${({ $drawer }) => ($drawer ? DRAWER : "0")};
  }
`;

const PublishRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  & > div:first-child {
    flex: 1;
    min-width: 16rem;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    text-decoration: none;
  }
`;

const StatusDot = styled.span<{ $live: boolean }>`
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  background: ${({ $live }) => ($live ? "var(--error-success-100)" : "var(--primary-black-30)")};
  box-shadow: 0 0 0 4px
    ${({ $live }) => ($live ? "var(--error-success-10)" : "var(--primary-black-5)")};
`;

const SlugLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  flex: 1;
  min-width: 18rem;

  input {
    flex: 1;
  }
`;

const Callout = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-lg);
  background: var(--accent-violet-10);
  border: 1px solid var(--accent-violet-100);

  & > svg {
    font-size: 1.75rem;
    color: var(--accent-violet-100);
    flex-shrink: 0;
  }

  & > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const DrawerPanel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: ${DRAWER};
  z-index: var(--z-modal);
  background: var(--primary-white);
  border-left: 1px solid var(--primary-black-10);
  box-shadow: -24px 0 60px -30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const DrawerHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

const DrawerEyebrow = styled.span`
  display: block;
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-black-60);
`;

const DrawerTitle = styled.h2`
  margin: 0.15rem 0 0;
  font-size: var(--text-xl);
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--primary-black-60);
  padding: 0.25rem;

  &:hover {
    color: var(--primary-black-100);
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DrawerFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--primary-black-10);

  p {
    margin-right: auto;
  }
`;

const CodeArea = styled(TextArea)`
  font-family: ui-monospace, "JetBrains Mono", Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  min-height: 22rem;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const Snippets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
`;

const SnippetButton = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--primary-black-10);
  background: var(--primary-white);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    border-color: var(--primary-black-60);
    background: var(--primary-black-5);
  }
`;

const Cheats = styled.details`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  border-top: 1px solid var(--primary-black-10);
  padding-top: 0.75rem;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--primary-black-100);
  }

  code {
    font-size: 0.85em;
    padding: 0.05em 0.35em;
    margin: 0 0.15em;
    border-radius: 4px;
    background: var(--primary-black-5);
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
`;

const ColorField = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: var(--text-sm);

  input[type="color"] {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid var(--primary-black-10);
    border-radius: var(--radius-md);
    background: none;
    cursor: pointer;
    flex-shrink: 0;
  }

  span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
`;

const HexInput = styled.input<{ $invalid: boolean }>`
  border: none;
  border-bottom: 1px solid
    ${({ $invalid }) => ($invalid ? "var(--error-failure-100)" : "var(--primary-black-10)")};
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  padding: 0.1rem 0;
  width: 6rem;
  background: transparent;
`;
