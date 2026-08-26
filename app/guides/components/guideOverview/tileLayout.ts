/**
 * Default arrangement of guide tiles on the canvas.
 *
 * Everything is stored in fractions of the canvas (0–1) rather than pixels, so
 * an arrangement made on a laptop still makes sense on an external monitor.
 */

export type Rect = { x: number; y: number; w: number; h: number; z: number };
export type Layout = Record<string, Rect>;

/**
 * Roughly how much room a section tends to need. Tiles are sized in proportion
 * to this, which is what makes the default board non-uniform: a Description
 * gets real space, a Submit form gets a strip.
 */
const SECTION_WEIGHT: Record<string, number> = {
  description: 3,
  requirements: 3,
  // The submit tile holds the whole return form inline, not a button that
  // opens one, so it needs room to be usable.
  submit: 3,
  topics: 2,
  goals: 2,
  materials: 2,
};

const DEFAULT_WEIGHT = 2;

export const weightOf = (id: string) => SECTION_WEIGHT[id] ?? DEFAULT_WEIGHT;

/** Column count that keeps tiles a readable width at full page width. */
export function columnsFor(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Splits an ordered list into `groups` contiguous runs, minimising the heaviest
 * run. Contiguous so the reading order survives, balanced so a single light
 * section doesn't get a whole column to itself.
 *
 * Brute force over cut positions: there are at most a handful of sections, so
 * the search space is tiny and an exact answer is cheaper than tuning a
 * heuristic.
 */
export function balancedGroups(weights: number[], groups: number): number[][] {
  const n = weights.length;
  if (groups >= n) return weights.map((_, index) => [index]);
  if (groups <= 1) return [weights.map((_, index) => index)];

  let best: number[][] = [weights.map((_, index) => index)];
  let bestMax = Infinity;
  const cuts: number[] = [];

  const evaluate = () => {
    const boundaries = [...cuts, n];
    const result: number[][] = [];
    let start = 0;
    let heaviest = 0;

    for (const end of boundaries) {
      const group: number[] = [];
      let sum = 0;
      for (let index = start; index < end; index++) {
        group.push(index);
        sum += weights[index];
      }
      if (group.length === 0) return;
      result.push(group);
      heaviest = Math.max(heaviest, sum);
      start = end;
    }

    if (heaviest < bestMax) {
      bestMax = heaviest;
      best = result;
    }
  };

  const recurse = (start: number, remaining: number) => {
    if (remaining === 1) {
      evaluate();
      return;
    }
    for (let cut = start + 1; cut <= n - remaining + 1; cut++) {
      cuts.push(cut);
      recurse(cut, remaining - 1);
      cuts.pop();
    }
  };

  recurse(0, groups);
  return best;
}

/**
 * Columns of stacked tiles, each tile's height proportional to its weight, the
 * whole thing filling the canvas exactly. Every rect is a starting point — the
 * student can drag and resize freely from here.
 */
export function defaultLayout(ids: string[]): Layout {
  const layout: Layout = {};
  if (ids.length === 0) return layout;

  const weights = ids.map(weightOf);
  const groups = balancedGroups(weights, Math.min(columnsFor(ids.length), ids.length));
  const columnWidth = 1 / groups.length;

  groups.forEach((group, column) => {
    const columnWeight = group.reduce((sum, index) => sum + weights[index], 0);
    let y = 0;

    group.forEach((index, position) => {
      // The last tile takes the remainder so rounding never leaves a sliver
      // of empty canvas at the bottom of a column.
      const height =
        position === group.length - 1 ? 1 - y : weights[index] / columnWeight;

      layout[ids[index]] = {
        x: column * columnWidth,
        y,
        w: columnWidth,
        h: height,
        z: index + 1,
      };
      y += height;
    });
  });

  return layout;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Grid the canvas is divided into when snapping is on. Deliberately fine —
 * snapping should tidy edges up, not force every tile into an identical cell.
 * A tile can be any whole number of columns and rows.
 */
export const GRID_COLUMNS = 12;
export const GRID_ROWS = 8;

export const snapTo = (value: number, divisions: number) =>
  Math.round(value * divisions) / divisions;

// ── Grid cells ────────────────────────────────────────────────────────────
//
// While snapping is on, tiles are reasoned about in whole grid cells rather
// than fractions. Integers make "do these two overlap?" exact, where fractions
// would leave hairline overlaps that depend on floating-point rounding.

export type Cell = { gx: number; gy: number; gw: number; gh: number };

export const toCell = (rect: Rect): Cell => ({
  gx: Math.round(rect.x * GRID_COLUMNS),
  gy: Math.round(rect.y * GRID_ROWS),
  gw: Math.max(1, Math.round(rect.w * GRID_COLUMNS)),
  gh: Math.max(1, Math.round(rect.h * GRID_ROWS)),
});

export const fromCell = (cell: Cell, z: number): Rect => ({
  x: cell.gx / GRID_COLUMNS,
  y: cell.gy / GRID_ROWS,
  w: cell.gw / GRID_COLUMNS,
  h: cell.gh / GRID_ROWS,
  z,
});

export const cellsOverlap = (a: Cell, b: Cell) =>
  a.gx < b.gx + b.gw &&
  b.gx < a.gx + a.gw &&
  a.gy < b.gy + b.gh &&
  b.gy < a.gy + a.gh;

type Placement = { id: string; cell: Cell };

/**
 * Makes room for the tile being dragged by pushing whatever it lands on
 * downward, cascading, then letting everything settle upward again so the
 * board doesn't end up full of holes.
 *
 * Returns null when the result won't fit in the grid's height — the canvas
 * doesn't scroll, so a move that can't be accommodated is refused rather than
 * pushing a tile off the bottom where it can't be seen.
 */
export function resolveOverlaps(
  placements: Placement[],
  movedId: string
): Placement[] | null {
  const moved = placements.find((entry) => entry.id === movedId);
  if (!moved) return null;
  if (moved.cell.gy + moved.cell.gh > GRID_ROWS) return null;

  const settled: Placement[] = [{ id: moved.id, cell: { ...moved.cell } }];

  // Nearest-first, so a tile just under the drop point is the one that yields.
  const others = placements
    .filter((entry) => entry.id !== movedId)
    .sort((a, b) => a.cell.gy - b.cell.gy || a.cell.gx - b.cell.gx);

  for (const entry of others) {
    const cell = { ...entry.cell };
    while (settled.some((placed) => cellsOverlap(cell, placed.cell))) {
      cell.gy += 1;
      if (cell.gy + cell.gh > GRID_ROWS) return null;
    }
    settled.push({ id: entry.id, cell });
  }

  return compactUpward(settled, movedId);
}

/**
 * Gravity. Every tile rises until it rests on another or the top edge — except
 * the one under the cursor, which stays exactly where it was dropped.
 */
function compactUpward(placements: Placement[], pinnedId: string): Placement[] {
  const byPosition = [...placements].sort(
    (a, b) => a.cell.gy - b.cell.gy || a.cell.gx - b.cell.gx
  );
  const settled: Placement[] = [];

  for (const entry of byPosition) {
    const cell = { ...entry.cell };
    if (entry.id !== pinnedId) {
      while (cell.gy > 0) {
        const lifted = { ...cell, gy: cell.gy - 1 };
        if (settled.some((placed) => cellsOverlap(lifted, placed.cell))) break;
        cell.gy = lifted.gy;
      }
    }
    settled.push({ id: entry.id, cell });
  }

  return settled;
}

/** Splits `total` rows between tiles in proportion to their weight, exactly. */
function splitRows(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((weight) => (weight / sum) * total);
  const rows = exact.map((value) => Math.max(1, Math.floor(value)));

  // Hand out the rounding remainder to whoever was closest to another whole
  // row, then claw back if the floors already overspent the height.
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  let used = rows.reduce((a, b) => a + b, 0);
  let cursor = 0;
  while (used < total && byFraction.length > 0) {
    rows[byFraction[cursor % byFraction.length].index] += 1;
    used += 1;
    cursor += 1;
  }
  while (used > total) {
    const biggest = rows
      .map((value, index) => ({ value, index }))
      .sort((a, b) => b.value - a.value)
      .find((entry) => entry.value > 1);
    if (!biggest) break;
    rows[biggest.index] -= 1;
    used -= 1;
  }

  return rows;
}

/**
 * A clean, grid-aligned, gap-free board — the "auto arrange". Tiles keep the
 * order they currently read in (left to right, top to bottom) so the board the
 * student built is recognisable afterwards, but sizes are re-derived so the
 * result is guaranteed to fit and never overlap.
 */
export function gridArrange(ids: string[], layout: Layout): Layout {
  const arranged: Layout = {};
  if (ids.length === 0) return arranged;

  const ordered = [...ids].sort((a, b) => {
    const left = layout[a];
    const right = layout[b];
    if (!left || !right) return 0;
    // A column's worth of tolerance, so tiles roughly in the same column are
    // ordered top-to-bottom rather than by a few pixels of horizontal drift.
    if (Math.abs(left.x - right.x) > 0.5 / GRID_COLUMNS) return left.x - right.x;
    return left.y - right.y;
  });

  const weights = ordered.map(weightOf);
  const groups = balancedGroups(
    weights,
    Math.min(columnsFor(ordered.length), ordered.length)
  );

  let gx = 0;
  groups.forEach((group, index) => {
    // Distribute the columns exactly, so the last group reaches the right edge.
    const remainingGroups = groups.length - index;
    const gw = Math.max(1, Math.round((GRID_COLUMNS - gx) / remainingGroups));
    const heights = splitRows(
      group.map((position) => weights[position]),
      GRID_ROWS
    );

    let gy = 0;
    group.forEach((position, slot) => {
      const gh = slot === group.length - 1 ? GRID_ROWS - gy : heights[slot];
      arranged[ordered[position]] = fromCell(
        { gx, gy, gw, gh },
        layout[ordered[position]]?.z ?? position + 1
      );
      gy += gh;
    });

    gx += gw;
  });

  return arranged;
}

/**
 * Brings a layout onto the grid. Quantising alone is enough when the board is
 * already tidy — which keeps a saved arrangement exactly as the student left
 * it — but rounding can push two tiles into each other, so anything that ends
 * up overlapping gets a full re-arrange instead.
 */
export function normalizeToGrid(ids: string[], layout: Layout): Layout {
  const cells = ids
    .filter((id) => layout[id])
    .map((id) => ({ id, cell: toCell(layout[id]) }));

  const fits = cells.every(
    (entry) =>
      entry.cell.gx + entry.cell.gw <= GRID_COLUMNS &&
      entry.cell.gy + entry.cell.gh <= GRID_ROWS
  );
  const clean = cells.every((entry, index) =>
    cells.every(
      (other, otherIndex) =>
        index === otherIndex || !cellsOverlap(entry.cell, other.cell)
    )
  );

  if (!fits || !clean) return gridArrange(ids, layout);

  const snapped: Layout = {};
  for (const entry of cells) {
    snapped[entry.id] = fromCell(entry.cell, layout[entry.id].z);
  }
  return snapped;
}
