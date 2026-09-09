"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocalState } from "utils/hooks/useStorage";
import { LoadingSpinner } from "UIcomponents/states/States";
import type { EditorGuideRow } from "serverActions/editGuideActions";
import { deleteGuide } from "serverActions/editGuideActions";
import {
  PageContainer,
  Header,
  Title,
  Subtitle,
  Toolbar,
  SearchInput,
  FilterSelect,
  ModuleHeading,
  GuidesList,
  GuideCard,
  CardTop,
  OrderBadge,
  GuideTitle,
  GuideDescription,
  Pills,
  Pill,
  GuideActions,
  ActionLink,
  DangerButton,
  ConfirmRow,
  ConfirmButton,
  Message,
  EmptyNote,
  ClearFiltersButton,
} from "./styles.EditGuidesPage";

// Strip markdown formatting for plain text preview
const stripMarkdown = (text: string, maxLength: number = 160): string => {
  if (!text) return "";

  let stripped = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^[-*_]{3,}$/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (stripped.length > maxLength) {
    stripped = stripped.substring(0, maxLength).trim() + "…";
  }

  return stripped;
};

type DisciplineFilter = "all" | "code" | "design";

type Filters = { search: string; discipline: DisciplineFilter; module: string };

const NO_FILTERS: Filters = { search: "", discipline: "all", module: "all" };

/**
 * Where the list's search and filters live between visits, so opening a guide
 * and coming back lands on the same list. Same idea as the module picker on
 * the student guide page.
 */
export const FILTERS_STORAGE_KEY = "editGuides:filters";

/**
 * The teacher's list of guides, grouped by module in the order students meet
 * them. Every action is a real link or an inline confirmation — no browser
 * alerts, no full reloads.
 */
export const EditGuidesPage = ({ guides }: { guides: EditorGuideRow[] }) => {
  const router = useRouter();
  const [storedFilters, setFilters, loadingFilters] = useLocalState<Partial<Filters>>(
    FILTERS_STORAGE_KEY,
    NO_FILTERS
  );
  // Over the defaults, so an older or hand-edited stored value never lacks a key.
  const filters: Filters = { ...NO_FILTERS, ...storedFilters };
  const { search: searchTerm, discipline, module: selectedModule } = filters;
  const setFilter = (change: Partial<Filters>) => setFilters({ ...filters, ...change });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [busy, startWork] = useTransition();

  const modules = useMemo(() => {
    const seen = new Map<number, string>();
    for (const guide of guides) {
      if (!seen.has(guide.moduleNumber)) seen.set(guide.moduleNumber, guide.moduleTitle);
    }
    return [...seen.entries()].sort(([a], [b]) => a - b);
  }, [guides]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return guides.filter((guide) => {
      if (discipline !== "all" && guide.discipline !== discipline) return false;
      if (selectedModule !== "all" && String(guide.moduleNumber) !== selectedModule) return false;
      if (!term) return true;
      return (
        guide.title.toLowerCase().includes(term) ||
        guide.description.toLowerCase().includes(term)
      );
    });
  }, [guides, searchTerm, discipline, selectedModule]);

  // Grouped for the headings; `filtered` is already in module order.
  const groups = useMemo(() => {
    const byModule = new Map<number, EditorGuideRow[]>();
    for (const guide of filtered) {
      const list = byModule.get(guide.moduleNumber);
      if (list) list.push(guide);
      else byModule.set(guide.moduleNumber, [guide]);
    }
    return [...byModule.entries()];
  }, [filtered]);

  const handleDelete = (guide: EditorGuideRow) => {
    setMessage(undefined);
    startWork(async () => {
      const result = await deleteGuide(guide.id);
      setConfirming(null);
      setMessage({
        ok: result.success,
        text: result.success ? `Deleted “${guide.title}”` : (result.message ?? "Could not delete the guide"),
      });
      if (result.success) router.refresh();
    });
  };

  // The saved filters arrive after the first render; showing the unfiltered
  // list first would flash every guide before narrowing down.
  if (loadingFilters) return <LoadingSpinner label="Loading guides…" />;

  return (
    <PageContainer>
      <Header>
        <Title>Edit guides</Title>
        <Subtitle>
          {guides.length} guides · open one to edit it, or view it the way a
          student sees it
        </Subtitle>
      </Header>

      <Toolbar>
        <SearchInput
          type="search"
          placeholder="Search by title or description…"
          aria-label="Search guides"
          value={searchTerm}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <FilterSelect
          aria-label="Filter by discipline"
          value={discipline}
          onChange={(e) => setFilter({ discipline: e.target.value as DisciplineFilter })}
        >
          <option value="all">Code and design</option>
          <option value="code">Code guides</option>
          <option value="design">Design guides</option>
        </FilterSelect>
        <FilterSelect
          aria-label="Filter by module"
          value={selectedModule}
          onChange={(e) => setFilter({ module: e.target.value })}
        >
          <option value="all">All modules</option>
          {modules.map(([number, title]) => (
            <option key={number} value={number}>
              {title || `Module ${number}`}
            </option>
          ))}
        </FilterSelect>
      </Toolbar>

      {message && (
        <Message role={message.ok ? "status" : "alert"} $error={!message.ok}>
          {message.text}
        </Message>
      )}

      {groups.length === 0 ? (
        <EmptyNote>
          No guides match.{" "}
          <ClearFiltersButton type="button" onClick={() => setFilters(NO_FILTERS)}>
            Clear the search and filters
          </ClearFiltersButton>
        </EmptyNote>
      ) : (
        groups.map(([number, moduleGuides]) => (
          <section key={number} aria-labelledby={`module-${number}`}>
            <ModuleHeading id={`module-${number}`}>
              {moduleGuides[0].moduleTitle || `Module ${number}`}
            </ModuleHeading>
            <GuidesList>
              {moduleGuides.map((guide) => (
                <GuideCard key={guide.id}>
                  <CardTop>
                    <OrderBadge>#{guide.order}</OrderBadge>
                    <GuideTitle>{guide.title}</GuideTitle>
                  </CardTop>
                  <Pills>
                    <Pill $tone={guide.discipline}>
                      {guide.discipline === "code" ? "Code" : "Design"}
                    </Pill>
                    {guide.isSpecialty && <Pill $tone="muted">Speciality</Pill>}
                    <Pill $tone="muted">
                      {guide.gradingMode === "auto" ? "Auto-graded" : "Peer review"}
                    </Pill>
                  </Pills>
                  {guide.description && (
                    <GuideDescription>{stripMarkdown(guide.description)}</GuideDescription>
                  )}
                  <GuideActions>
                    <ActionLink href={`/LMS/edit-guides/${guide.id}`} $primary>
                      Edit
                    </ActionLink>
                    <ActionLink href={`/guides/${guide.id}`} target="_blank" rel="noopener noreferrer">
                      View as student
                    </ActionLink>
                    {confirming === guide.id ? (
                      <ConfirmRow>
                        Delete this guide?
                        <ConfirmButton
                          type="button"
                          $danger
                          disabled={busy}
                          onClick={() => handleDelete(guide)}
                        >
                          {busy ? "Deleting…" : "Yes, delete"}
                        </ConfirmButton>
                        <ConfirmButton
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirming(null)}
                        >
                          Keep it
                        </ConfirmButton>
                      </ConfirmRow>
                    ) : (
                      <DangerButton
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirming(guide.id)}
                      >
                        Delete
                      </DangerButton>
                    )}
                  </GuideActions>
                </GuideCard>
              ))}
            </GuidesList>
          </section>
        ))
      )}
    </PageContainer>
  );
};
