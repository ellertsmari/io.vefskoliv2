"use client";

import { useMemo, useRef, useState } from "react";
import MarkdownReader from "UIcomponents/markdown/reader";
import { InlineReturnForm } from "../feedback/returnForm/ReturnForm";
import { ExerciseLauncher } from "../exercise/ExerciseLauncher";
import { ClientGuide, GradingMode } from "types/guideTypes";
import type { ExerciseSummary } from "serverActions/exerciseSession";
import { useLocalState } from "utils/hooks/useStorage";
import {
  defaultLayout,
  clamp,
  snapTo,
  toCell,
  fromCell,
  resolveOverlaps,
  cellsOverlap,
  normalizeToGrid,
  gridArrange,
  GRID_COLUMNS,
  GRID_ROWS,
  type Layout,
  type Rect,
} from "./tileLayout";
import {
  Shell,
  Header,
  TitleBlock,
  PageTitle,
  Eyebrow,
  Controls,
  ControlsDivider,
  Toolbar,
  ToolButton,
  Dock,
  DockChip,
  EmptyCanvasHint,
  MinimizeButton,
  Canvas,
  Tile,
  TileHead,
  TileIcon,
  TileTitle,
  GripButton,
  TileBody,
  ResizeHandle,
  SubSectionHeading,
  MaterialsList,
  MaterialLink,
} from "./style";
import {
  DescriptionIcon,
  TopicsIcon,
  GoalsIcon,
  RequirementsIcon,
  MaterialsIcon,
  SubmitIcon,
  GripIcon,
  GridIcon,
  ArrangeIcon,
  ResetIcon,
  MinimizeIcon,
} from "./sectionIcons";

type GuideSection = {
  id: string;
  label: string;
  /** Name of the --accent-* token family this section is identified by. */
  accent: string;
  icon: React.ReactNode;
  body: React.ReactNode;
};

/**
 * One hue per section. Fixed per section rather than assigned by position, so a
 * guide without Topics doesn't shift every other tile's colour along.
 */
const SECTION_ACCENT: Record<string, string> = {
  description: "violet",
  topics: "blue",
  goals: "teal",
  requirements: "amber",
  materials: "rose",
  submit: "green",
};

const accentFor = (id: string) => SECTION_ACCENT[id] ?? "violet";

type DragMode = "move" | "resize";

type DragState = {
  id: string;
  mode: DragMode;
  pointerX: number;
  pointerY: number;
  origin: Rect;
  canvasWidth: number;
  canvasHeight: number;
  /** The whole board, since resolving a collision moves other tiles too. */
  latest: Layout;
  /** Whether `latest` is a legal snapped board, or just a floating preview. */
  resolved: boolean;
  /** Tile to trade places with if the board is too full to push into. */
  swapWith: string | null;
};

/** Below these a tile stops being readable, so resizing stops there. */
const MIN_TILE_WIDTH = 220;
const MIN_TILE_HEIGHT = 140;

/** Half the visual gutter between tiles, applied as an inset on every side. */
const TILE_INSET = 6;

/** One nudge of a tile by keyboard, as a fraction of the canvas. */
const NUDGE_STEP = 0.05;

export const GuideOverview = ({
  guide,
  isAuthenticated = true, // Default to true to maintain backwards compatibility
  exerciseSummary,
}: {
  guide: ClientGuide;
  isAuthenticated?: boolean;
  exerciseSummary?: ExerciseSummary;
}) => {
  const guideId = guide?._id?.toString() ?? "unknown";
  const [savedLayout, setSavedLayout] = useLocalState<Layout>(
    `guide-canvas-${guideId}`,
    {}
  );
  // Snapping is a preference, not a per-guide setting — someone who likes tidy
  // edges wants them everywhere.
  const [snapEnabled, setSnapEnabled] = useLocalState<boolean>(
    "guide-canvas-snap",
    false
  );
  // Minimised tiles, per guide. Empty by default, so every section shows.
  const [hiddenIds, setHiddenIds] = useLocalState<string[]>(
    `guide-hidden-${guideId}`,
    []
  );
  const [draft, setDraft] = useState<{
    id: string;
    layout: Layout;
    swapWith: string | null;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const sections = useMemo(
    () => (guide ? buildSections(guide, isAuthenticated, exerciseSummary) : []),
    [guide, isAuthenticated, exerciseSummary]
  );

  // A saved arrangement can outlive the guide it was saved for — a section may
  // have been added or emptied since — so anything unrecognised falls back to
  // its default rect rather than vanishing or landing at 0,0.
  const layout = useMemo(() => {
    const ids = sections.map((section) => section.id);
    const base = defaultLayout(ids);
    const hasSaved = ids.some((id) => savedLayout[id]);

    // Nothing saved yet: the starting board is generated, so with snapping on
    // it can be generated already on-grid rather than quantised afterwards.
    if (!hasSaved) return snapEnabled ? gridArrange(ids, base) : base;

    // Otherwise show exactly what was saved. Re-arranging here would mean a
    // render could silently resize tiles the student placed themselves;
    // straightening the board is what the toolbar buttons are for.
    for (const [id, rect] of Object.entries(savedLayout)) {
      if (base[id]) base[id] = rect;
    }
    return base;
  }, [sections, savedLayout, snapEnabled]);

  if (!guide) {
    return <h1>Guide not found</h1>;
  }

  const rectFor = (id: string): Rect => draft?.layout[id] ?? layout[id];

  const commit = (id: string, rect: Rect) =>
    setSavedLayout({ ...layout, [id]: rect });

  const bringToFront = (id: string) => {
    const highest = Math.max(...Object.values(layout).map((rect) => rect.z));
    if (layout[id].z === highest) return layout[id];
    const raised = { ...layout[id], z: highest + 1 };
    commit(id, raised);
    return raised;
  };

  const startDrag = (
    event: React.PointerEvent<HTMLElement>,
    id: string,
    mode: DragMode
  ) => {
    const canvas = canvasRef.current;
    // The stacked mobile layout has no canvas positioning to drag within.
    if (!canvas || window.innerWidth <= 700) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = canvas.getBoundingClientRect();
    const origin = bringToFront(id);

    dragRef.current = {
      id,
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY,
      origin,
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
      latest: { ...layout, [id]: origin },
      resolved: true,
      swapWith: null,
    };
  };

  const onDragMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = (event.clientX - drag.pointerX) / drag.canvasWidth;
    const dy = (event.clientY - drag.pointerY) / drag.canvasHeight;
    const minW = MIN_TILE_WIDTH / drag.canvasWidth;
    const minH = MIN_TILE_HEIGHT / drag.canvasHeight;
    const { origin } = drag;

    // Snap before clamping, so a tile pushed against an edge still lands on
    // the boundary rather than one grid step short of it.
    const alignX = (value: number) =>
      snapEnabled ? snapTo(value, GRID_COLUMNS) : value;
    const alignY = (value: number) =>
      snapEnabled ? snapTo(value, GRID_ROWS) : value;

    const next: Rect =
      drag.mode === "move"
        ? {
            ...origin,
            x: clamp(alignX(origin.x + dx), 0, 1 - origin.w),
            y: clamp(alignY(origin.y + dy), 0, 1 - origin.h),
          }
        : {
            // Sizes snap to whole grid steps too, but a tile can be any number
            // of them — snapping tidies the edges, it doesn't make tiles equal.
            ...origin,
            w: clamp(alignX(origin.w + dx), minW, 1 - origin.x),
            h: clamp(alignY(origin.h + dy), minH, 1 - origin.y),
          };

    if (!snapEnabled) {
      drag.latest = { ...layout, [drag.id]: next };
      drag.resolved = true;
      setDraft({ id: drag.id, layout: drag.latest, swapWith: null });
      return;
    }

    // Snapped: landing on another tile pushes it out of the way rather than
    // covering it.
    const placements = Object.keys(layout).map((id) => ({
      id,
      cell: toCell(id === drag.id ? next : layout[id]),
    }));
    const resolved = resolveOverlaps(placements, drag.id);

    if (resolved) {
      const settled: Layout = {};
      for (const { id, cell } of resolved) {
        settled[id] = fromCell(cell, layout[id].z);
      }
      drag.latest = settled;
      drag.resolved = true;
      drag.swapWith = null;
      setDraft({ id: drag.id, layout: settled, swapWith: null });
      return;
    }

    // Nothing could be pushed anywhere — the board is packed, which is the
    // normal state here, since the default layout fills the canvas exactly.
    // Offer a swap instead: trading two tiles' cells is always legal, because
    // the pair of regions they occupy between them doesn't change.
    const movedCell = toCell(next);
    const swapWith =
      drag.mode === "move"
        ? Object.keys(layout).find(
            (id) => id !== drag.id && cellsOverlap(toCell(layout[id]), movedCell)
          ) ?? null
        : null;

    drag.latest = { ...layout, [drag.id]: next };
    drag.resolved = false;
    drag.swapWith = swapWith;
    setDraft({ id: drag.id, layout: drag.latest, swapWith });
  };

  const endDrag = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDraft(null);
    if (!drag) return;

    if (drag.resolved) {
      setSavedLayout(drag.latest);
      return;
    }
    if (drag.swapWith) {
      const dragged = layout[drag.id];
      const target = layout[drag.swapWith];
      setSavedLayout({
        ...layout,
        [drag.id]: { ...target, z: dragged.z },
        [drag.swapWith]: { ...dragged, z: target.z },
      });
    }
    // Otherwise the move had nowhere legal to go, so the tile springs back.
  };

  /** Arrow keys move a tile, so arranging isn't mouse-only. */
  const onGripKeyDown = (event: React.KeyboardEvent, id: string) => {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE_STEP, 0],
      ArrowRight: [NUDGE_STEP, 0],
      ArrowUp: [0, -NUDGE_STEP],
      ArrowDown: [0, NUDGE_STEP],
    };
    const step = steps[event.key];
    if (!step) return;

    event.preventDefault();
    const rect = layout[id];
    // One grid cell at a time while snapping, so the keyboard lands on the same
    // positions the mouse does.
    const dx = snapEnabled ? Math.sign(step[0]) / GRID_COLUMNS : step[0];
    const dy = snapEnabled ? Math.sign(step[1]) / GRID_ROWS : step[1];
    const moved: Rect = {
      ...rect,
      x: clamp(rect.x + dx, 0, 1 - rect.w),
      y: clamp(rect.y + dy, 0, 1 - rect.h),
    };

    if (!snapEnabled) {
      commit(id, moved);
      return;
    }

    const placements = Object.keys(layout).map((tileId) => ({
      tileId,
      cell: toCell(tileId === id ? moved : layout[tileId]),
    }));
    const resolved = resolveOverlaps(
      placements.map((entry) => ({ id: entry.tileId, cell: entry.cell })),
      id
    );
    if (!resolved) return;

    const settled: Layout = {};
    for (const entry of resolved) {
      settled[entry.id] = fromCell(entry.cell, layout[entry.id].z);
    }
    setSavedLayout(settled);
  };

  /**
   * Turning snapping on aligns what is already on the canvas, rather than only
   * affecting the next drag — otherwise the grid appears under tiles that
   * visibly don't line up with it, which reads as broken.
   *
   * Each tile snaps its own position and size, so they stay different sizes;
   * the grid is a ruling to align to, not a set of uniform cells.
   */
  const toggleSnap = () => {
    const enabling = !snapEnabled;
    setSnapEnabled(enabling);
    if (enabling) {
      setSavedLayout({ ...layout, ...normalizeToGrid(visibleIds, layout) });
    }
  };

  /**
   * Re-packs the board into a tidy grid without touching the snap setting.
   * Only what's on the canvas — minimised tiles keep their stored rect for
   * whenever they come back.
   */
  const autoArrange = () => {
    setSavedLayout({ ...layout, ...gridArrange(visibleIds, layout) });
  };

  const hidden = new Set(hiddenIds);
  const visibleSections = sections.filter((section) => !hidden.has(section.id));
  const visibleIds = visibleSections.map((section) => section.id);

  const minimize = (id: string) => {
    // Positions are left exactly as they are: the tile's slot stays empty so
    // restoring it is always possible, and nothing the student arranged moves
    // because they closed something else.
    if (!hidden.has(id)) setHiddenIds([...hiddenIds, id]);
  };

  const restore = (id: string) => {
    const nextHidden = hiddenIds.filter((hiddenId) => hiddenId !== id);
    setHiddenIds(nextHidden);
    if (!snapEnabled) return;

    // Its old slot is normally still free, but tiles moved while it was away
    // could have taken it — so make room the same way a drag would.
    const back = sections
      .map((section) => section.id)
      .filter((sectionId) => !nextHidden.includes(sectionId));
    const placements = back.map((sectionId) => ({
      id: sectionId,
      cell: toCell(layout[sectionId]),
    }));
    const resolved = resolveOverlaps(placements, id);

    if (resolved) {
      const settled: Layout = { ...layout };
      for (const entry of resolved) {
        settled[entry.id] = fromCell(entry.cell, layout[entry.id].z);
      }
      setSavedLayout(settled);
      return;
    }
    setSavedLayout({ ...layout, ...gridArrange(back, layout) });
  };

  const isArranged =
    Object.keys(savedLayout).length > 0 || hiddenIds.length > 0;

  const resetLayout = () => {
    setSavedLayout({});
    setHiddenIds([]);
  };

  return (
    <Shell>
      <Header>
        <TitleBlock>
          {guide.module && <Eyebrow>{guide.module.title}</Eyebrow>}
          <PageTitle>{guide.title}</PageTitle>
        </TitleBlock>
        <Controls>
          <Dock>
            {sections.map((section) => {
              const showing = !hidden.has(section.id);
              return (
                <DockChip
                  key={section.id}
                  type="button"
                  $visible={showing}
                  $accent={section.accent}
                  aria-pressed={showing}
                  title={
                    showing ? `Hide ${section.label}` : `Show ${section.label}`
                  }
                  onClick={() =>
                    showing ? minimize(section.id) : restore(section.id)
                  }
                >
                  {section.icon}
                  {section.label}
                </DockChip>
              );
            })}
          </Dock>

          <ControlsDivider aria-hidden="true" />

          <Toolbar>
            <ToolButton
              type="button"
              $active={snapEnabled}
              aria-pressed={snapEnabled}
              onClick={toggleSnap}
            >
              <GridIcon />
              Snap to grid
            </ToolButton>
            {snapEnabled && (
              <ToolButton type="button" onClick={autoArrange}>
                <ArrangeIcon />
                Auto arrange
              </ToolButton>
            )}
            {isArranged && (
              <ToolButton type="button" onClick={resetLayout}>
                <ResetIcon />
                Reset layout
              </ToolButton>
            )}
          </Toolbar>
        </Controls>
      </Header>

      <Canvas ref={canvasRef}>
        {visibleSections.length === 0 && (
          <EmptyCanvasHint>
            Every section is minimised — pick one above to bring it back.
          </EmptyCanvasHint>
        )}
        {visibleSections.map((section) => {
          const rect = rectFor(section.id);
          return (
            <Tile
              key={section.id}
              $dragging={draft?.id === section.id}
              $swapTarget={draft?.swapWith === section.id}
              $accent={section.accent}
              style={
                {
                  "--tile-x": `calc(${rect.x * 100}% + ${TILE_INSET}px)`,
                  "--tile-y": `calc(${rect.y * 100}% + ${TILE_INSET}px)`,
                  "--tile-w": `calc(${rect.w * 100}% - ${TILE_INSET * 2}px)`,
                  "--tile-h": `calc(${rect.h * 100}% - ${TILE_INSET * 2}px)`,
                  zIndex: rect.z,
                } as React.CSSProperties
              }
            >
              <TileHead
                onPointerDown={(event) => startDrag(event, section.id, "move")}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <TileIcon $accent={section.accent}>{section.icon}</TileIcon>
                <TileTitle>{section.label}</TileTitle>
                <GripButton
                  type="button"
                  aria-label={`Move ${section.label}. Use the arrow keys to reposition it.`}
                  onKeyDown={(event) => onGripKeyDown(event, section.id)}
                >
                  <GripIcon />
                </GripButton>
                <MinimizeButton
                  type="button"
                  aria-label={`Minimise ${section.label}`}
                  title={`Minimise ${section.label}`}
                  /* The header is the drag surface, so this has to keep its
                     own pointerdown from starting a drag underneath it. */
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => minimize(section.id)}
                >
                  <MinimizeIcon />
                </MinimizeButton>
              </TileHead>

              <TileBody>{section.body}</TileBody>

              <ResizeHandle
                role="presentation"
                onPointerDown={(event) => startDrag(event, section.id, "resize")}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            </Tile>
          );
        })}
      </Canvas>
    </Shell>
  );
};

/**
 * The sections this guide actually has. Empty ones are dropped rather than
 * rendered blank — an empty tile would take up space on the canvas.
 */
function buildSections(
  guide: ClientGuide,
  isAuthenticated: boolean,
  exerciseSummary?: ExerciseSummary
): GuideSection[] {
  const {
    description,
    knowledge,
    skills,
    themeIdea,
    resources,
    classes: cMaterials,
    topicsList,
    references,
  } = guide;

  const materials = resources
    .map((material) => ({ title: material.description, link: material.link }))
    .concat(cMaterials)
    .concat(
      (references ?? []).map((ref) => ({ title: ref.name, link: ref.link }))
    )
    // Entries with no title can't be rendered, and shouldn't count towards
    // whether the tile exists at all.
    .filter((material) => material.title);

  const isAutoGraded = guide.gradingMode === GradingMode.AUTO && !!guide.exercise;
  const sections: GuideSection[] = [];

  if (description) {
    sections.push({
      id: "description",
      label: "Description",
      accent: accentFor("description"),
      icon: <DescriptionIcon />,
      body: <MarkdownReader>{description}</MarkdownReader>,
    });
  }

  if (topicsList) {
    sections.push({
      id: "topics",
      label: "Topics",
      accent: accentFor("topics"),
      icon: <TopicsIcon />,
      body: <MarkdownReader>{topicsList}</MarkdownReader>,
    });
  }

  if (knowledge.length > 0 || skills.length > 0) {
    sections.push({
      id: "goals",
      label: "Goals",
      accent: accentFor("goals"),
      icon: <GoalsIcon />,
      body: (
        <>
          {knowledge.length > 0 && (
            <>
              <SubSectionHeading>Knowledge</SubSectionHeading>
              {knowledge.map((entry) => (
                <MarkdownReader key={String(entry.knowledge)}>
                  {String(entry.knowledge)}
                </MarkdownReader>
              ))}
            </>
          )}
          {skills.length > 0 && (
            <>
              <SubSectionHeading>Skills</SubSectionHeading>
              {skills.map((entry) => (
                <MarkdownReader key={String(entry.skill)}>
                  {String(entry.skill)}
                </MarkdownReader>
              ))}
            </>
          )}
        </>
      ),
    });
  }

  if (themeIdea?.description) {
    sections.push({
      id: "requirements",
      // Fixed rather than themeIdea.title: that field holds a per-guide name
      // ("Report and Demo", "Technical Article"), so the same tile was called
      // something different on every guide and never said what it actually is.
      label: "Idea for return",
      accent: accentFor("requirements"),
      icon: <RequirementsIcon />,
      body: <MarkdownReader>{themeIdea.description}</MarkdownReader>,
    });
  }

  if (materials.length > 0) {
    sections.push({
      id: "materials",
      label: "Materials",
      accent: accentFor("materials"),
      icon: <MaterialsIcon />,
      body: (
        <MaterialsList>
          {materials.map((material) => (
            <MaterialLink
              key={material.link}
              href={material.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {material.title}
            </MaterialLink>
          ))}
        </MaterialsList>
      ),
    });
  }

  // Auto-graded guides only get a tile once there is a summary to launch from;
  // everyone else gets the return form.
  const submission = isAutoGraded ? (
    exerciseSummary ? (
      <ExerciseLauncher
        guideId={guide._id.toString()}
        summary={exerciseSummary}
      />
    ) : null
  ) : (
    <InlineReturnForm guideId={guide._id.toString()} />
  );

  if (isAuthenticated && submission) {
    sections.push({
      id: "submit",
      label: "Submit",
      accent: accentFor("submit"),
      icon: <SubmitIcon />,
      body: submission,
    });
  }

  return sections;
}
