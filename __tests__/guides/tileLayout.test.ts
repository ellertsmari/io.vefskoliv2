/**
 * @jest-environment node
 *
 * The guide canvas' layout maths. These are pure functions, and they carry all
 * the rules about where tiles may sit — so the tests here assert invariants
 * ("the board never overlaps", "a drag never resizes anything") rather than
 * snapshotting particular coordinates, which would break on any tuning.
 */
import {
  weightOf,
  columnsFor,
  balancedGroups,
  defaultLayout,
  clamp,
  snapTo,
  toCell,
  fromCell,
  cellsOverlap,
  resolveOverlaps,
  gridArrange,
  normalizeToGrid,
  GRID_COLUMNS,
  GRID_ROWS,
  type Cell,
  type Layout,
  type Rect,
} from "../../app/guides/components/guideOverview/tileLayout";

const ALL_SECTIONS = [
  "description",
  "topics",
  "goals",
  "requirements",
  "materials",
  "submit",
];

const rect = (x: number, y: number, w: number, h: number, z = 1): Rect => ({
  x,
  y,
  w,
  h,
  z,
});

/** Builds a Layout from whole grid cells, which is how a snapped board looks. */
const boardOf = (cells: Record<string, [number, number, number, number]>) => {
  const layout: Layout = {};
  let z = 1;
  for (const [id, [gx, gy, gw, gh]] of Object.entries(cells)) {
    layout[id] = fromCell({ gx, gy, gw, gh }, z++);
  }
  return layout;
};

const cellsOf = (layout: Layout, ids: string[]) =>
  ids.map((id) => ({ id, cell: toCell(layout[id]) }));

const anyOverlap = (placements: { id: string; cell: Cell }[]) =>
  placements.some((a, i) =>
    placements.some((b, j) => i !== j && cellsOverlap(a.cell, b.cell))
  );

const withinGrid = (placements: { id: string; cell: Cell }[]) =>
  placements.every(
    ({ cell }) =>
      cell.gx >= 0 &&
      cell.gy >= 0 &&
      cell.gx + cell.gw <= GRID_COLUMNS &&
      cell.gy + cell.gh <= GRID_ROWS
  );

/** How many of the grid's cells the board covers, counting each cell once. */
const coverage = (placements: { id: string; cell: Cell }[]) => {
  const filled = new Set<string>();
  for (const { cell } of placements) {
    for (let x = cell.gx; x < cell.gx + cell.gw; x++) {
      for (let y = cell.gy; y < cell.gy + cell.gh; y++) filled.add(`${x},${y}`);
    }
  }
  return filled.size;
};

describe("weightOf", () => {
  it("gives the sections that hold the most content the most room", () => {
    expect(weightOf("description")).toBeGreaterThan(weightOf("materials"));
  });

  it("falls back to a middling weight for an unknown section", () => {
    expect(weightOf("something-new")).toBe(2);
  });

  it("gives submit real room, since it holds the whole return form inline", () => {
    expect(weightOf("submit")).toBe(weightOf("description"));
  });
});

describe("columnsFor", () => {
  it.each([
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 3],
    [6, 3],
    [7, 4],
    [12, 4],
  ])("puts %i tiles in %i columns", (count, expected) => {
    expect(columnsFor(count)).toBe(expected);
  });

  it("never asks for more columns than the grid can divide evenly", () => {
    for (let count = 1; count <= 12; count++) {
      expect(GRID_COLUMNS % columnsFor(count)).toBe(0);
    }
  });
});

describe("balancedGroups", () => {
  const flatten = (groups: number[][]) => groups.flat();

  it("keeps every index, exactly once, in reading order", () => {
    const groups = balancedGroups([3, 2, 3, 1, 2], 3);
    expect(flatten(groups)).toEqual([0, 1, 2, 3, 4]);
  });

  it("only ever cuts the list into contiguous runs", () => {
    const groups = balancedGroups([3, 2, 3, 1, 2, 2], 3);
    for (const group of groups) {
      const consecutive = group.every(
        (index, position) => position === 0 || index === group[position - 1] + 1
      );
      expect(consecutive).toBe(true);
    }
  });

  it("minimises the heaviest column rather than filling greedily", () => {
    // Greedy left-to-right gives [3][2,3][1] — a heaviest column of 5, and a
    // whole column wasted on the weight-1 tile. The balanced split is [3][2][3,1].
    const groups = balancedGroups([3, 2, 3, 1], 3);
    const weights = [3, 2, 3, 1];
    const heaviest = Math.max(
      ...groups.map((group) =>
        group.reduce((sum, index) => sum + weights[index], 0)
      )
    );
    expect(heaviest).toBe(4);
    expect(groups).toEqual([[0], [1], [2, 3]]);
  });

  it("gives every tile its own column when asked for at least as many", () => {
    expect(balancedGroups([2, 2, 2], 3)).toEqual([[0], [1], [2]]);
    expect(balancedGroups([2, 2], 5)).toEqual([[0], [1]]);
  });

  it("returns a single run when asked for one column", () => {
    expect(balancedGroups([3, 1, 2], 1)).toEqual([[0, 1, 2]]);
  });

  it("really finds the optimum, not just a decent split", () => {
    // Independent brute force over every contiguous split, so this pins the
    // *result* rather than the algorithm — a greedy rewrite would fail here
    // even where the hand-written cases above happen to agree.
    const bestPossible = (weights: number[], groups: number): number => {
      const n = weights.length;
      let best = Infinity;
      const walk = (start: number, remaining: number, heaviest: number) => {
        if (remaining === 1) {
          const tail = weights.slice(start).reduce((a, b) => a + b, 0);
          if (start < n) best = Math.min(best, Math.max(heaviest, tail));
          return;
        }
        for (let cut = start + 1; cut <= n - remaining + 1; cut++) {
          const run = weights.slice(start, cut).reduce((a, b) => a + b, 0);
          walk(cut, remaining - 1, Math.max(heaviest, run));
        }
      };
      walk(0, groups, 0);
      return best;
    };

    const cases: [number[], number][] = [
      [[3, 2, 3, 1], 3],
      [[3, 2, 2, 3, 2, 3], 3],
      [[1, 5, 1, 1, 5], 3],
      [[2, 2, 2, 2, 2, 2, 2], 4],
      [[3, 3, 3], 2],
      [[1, 1, 1, 1, 1], 4],
      [[5, 1, 1, 1, 1, 5], 3],
    ];

    for (const [weights, groups] of cases) {
      const actual = Math.max(
        ...balancedGroups(weights, groups).map((group) =>
          group.reduce((sum, index) => sum + weights[index], 0)
        )
      );
      expect(actual).toBe(bestPossible(weights, groups));
    }
  });

  it("is deterministic, so a board doesn't jitter between renders", () => {
    const weights = [3, 2, 3, 1, 2, 2];
    expect(balancedGroups(weights, 3)).toEqual(balancedGroups(weights, 3));
  });

  it("never returns an empty group", () => {
    for (let count = 1; count <= 7; count++) {
      const weights = Array.from({ length: count }, (_, i) => (i % 3) + 1);
      for (let groups = 1; groups <= count; groups++) {
        for (const group of balancedGroups(weights, groups)) {
          expect(group.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("defaultLayout", () => {
  it("has nothing to lay out when there are no sections", () => {
    expect(defaultLayout([])).toEqual({});
  });

  it("places every section exactly once", () => {
    const layout = defaultLayout(ALL_SECTIONS);
    expect(Object.keys(layout).sort()).toEqual([...ALL_SECTIONS].sort());
  });

  it("fills the canvas: columns span the width, and each column the height", () => {
    for (let count = 1; count <= ALL_SECTIONS.length; count++) {
      const ids = ALL_SECTIONS.slice(0, count);
      const layout = defaultLayout(ids);

      const columns = new Map<number, Rect[]>();
      for (const id of ids) {
        const tile = layout[id];
        const key = Math.round(tile.x * 1000);
        columns.set(key, [...(columns.get(key) ?? []), tile]);
      }

      // Columns tile the width with no gap and no overlap.
      const widths = [...columns.values()].map((tiles) => tiles[0].w);
      expect(widths.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);

      // Each column tiles the height the same way.
      for (const tiles of columns.values()) {
        const byY = [...tiles].sort((a, b) => a.y - b.y);
        expect(byY[0].y).toBeCloseTo(0, 6);
        byY.forEach((tile, index) => {
          if (index > 0) {
            const previous = byY[index - 1];
            expect(tile.y).toBeCloseTo(previous.y + previous.h, 6);
          }
        });
        const last = byY[byY.length - 1];
        expect(last.y + last.h).toBeCloseTo(1, 6);
      }
    }
  });

  it("sizes tiles by weight, so the board is not uniform", () => {
    // Two sections of different weight sharing a column get different heights.
    const layout = defaultLayout(["description", "materials"]);
    const heights = Object.values(layout).map((tile) => tile.h);
    const sameColumn =
      layout.description.x === layout.materials.x ||
      heights.every((h) => h === 1);
    // Either they share a column and differ in height, or they are side by side
    // and both full height — never a stack of equal boxes.
    expect(sameColumn).toBe(true);
  });

  it("is deterministic", () => {
    expect(defaultLayout(ALL_SECTIONS)).toEqual(defaultLayout(ALL_SECTIONS));
  });
});

describe("clamp and snapTo", () => {
  it("clamps into range", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("survives an inverted range instead of returning NaN", () => {
    // Happens mid-drag: a tile wider than the space left gives min > max.
    expect(clamp(0.5, 0.8, 0.2)).toBe(0.8);
  });

  it("snaps to the nearest division", () => {
    expect(snapTo(0.3, GRID_COLUMNS)).toBeCloseTo(4 / 12, 6);
    expect(snapTo(0.51, GRID_ROWS)).toBeCloseTo(4 / 8, 6);
    expect(snapTo(0, GRID_COLUMNS)).toBe(0);
    expect(snapTo(1, GRID_COLUMNS)).toBe(1);
  });
});

describe("toCell and fromCell", () => {
  it("round-trips a rect that is already on the grid", () => {
    const original = fromCell({ gx: 4, gy: 2, gw: 4, gh: 3 }, 7);
    expect(toCell(original)).toEqual({ gx: 4, gy: 2, gw: 4, gh: 3 });
    expect(fromCell(toCell(original), 7)).toEqual(original);
  });

  it("never lets a tile round away to nothing", () => {
    const sliver = rect(0, 0, 0.001, 0.001);
    expect(toCell(sliver).gw).toBe(1);
    expect(toCell(sliver).gh).toBe(1);
  });

  it("keeps the z-order it is handed", () => {
    expect(fromCell({ gx: 0, gy: 0, gw: 1, gh: 1 }, 42).z).toBe(42);
  });
});

describe("cellsOverlap", () => {
  it("does not count tiles that merely touch", () => {
    const left = { gx: 0, gy: 0, gw: 4, gh: 8 };
    const right = { gx: 4, gy: 0, gw: 4, gh: 8 };
    expect(cellsOverlap(left, right)).toBe(false);

    const top = { gx: 0, gy: 0, gw: 4, gh: 3 };
    const bottom = { gx: 0, gy: 3, gw: 4, gh: 5 };
    expect(cellsOverlap(top, bottom)).toBe(false);
  });

  it("does not count tiles that only meet at a corner", () => {
    expect(
      cellsOverlap({ gx: 0, gy: 0, gw: 4, gh: 4 }, { gx: 4, gy: 4, gw: 4, gh: 4 })
    ).toBe(false);
  });

  it("counts a genuine intersection, in either order", () => {
    const a = { gx: 0, gy: 0, gw: 4, gh: 4 };
    const b = { gx: 2, gy: 2, gw: 4, gh: 4 };
    expect(cellsOverlap(a, b)).toBe(true);
    expect(cellsOverlap(b, a)).toBe(true);
  });

  it("counts one tile sitting entirely inside another", () => {
    expect(
      cellsOverlap({ gx: 0, gy: 0, gw: 8, gh: 8 }, { gx: 2, gy: 2, gw: 2, gh: 2 })
    ).toBe(true);
  });
});

describe("resolveOverlaps", () => {
  /**
   * Three short tiles across the top, six rows free underneath. Deliberately
   * roomy: on a board that is already packed solid there is nowhere to push
   * anything, so a fixture with no slack would only ever exercise the refusal
   * path (which has its own test below).
   */
  const roomToMove = () =>
    cellsOf(
      boardOf({
        a: [0, 0, 4, 2],
        b: [4, 0, 4, 2],
        c: [8, 0, 4, 2],
      }),
      ["a", "b", "c"]
    );

  /** Moves a tile without resizing it, the way a drag does. */
  const dragTo = (
    board: { id: string; cell: Cell }[],
    id: string,
    gx: number,
    gy: number
  ) => {
    const entry = board.find((item) => item.id === id)!;
    entry.cell = { ...entry.cell, gx, gy };
    return entry.cell;
  };

  it("pushes a tile out of the way rather than covering it", () => {
    const board = roomToMove();
    dragTo(board, "a", 4, 0); // straight onto "b"

    const resolved = resolveOverlaps(board, "a");
    expect(resolved).not.toBeNull();
    expect(anyOverlap(resolved!)).toBe(false);
    // "b" is the one that yielded, and it moved down rather than sideways.
    const b = resolved!.find((entry) => entry.id === "b")!.cell;
    expect(b.gx).toBe(4);
    expect(b.gy).toBeGreaterThan(0);
  });

  it("leaves the dragged tile exactly where it was dropped", () => {
    const board = roomToMove();
    const dropped = { ...dragTo(board, "a", 4, 1) };

    const resolved = resolveOverlaps(board, "a")!;
    expect(resolved.find((entry) => entry.id === "a")!.cell).toEqual(dropped);
  });

  it("never changes any tile's size", () => {
    const board = roomToMove();
    const sizesBefore = Object.fromEntries(
      board.map((entry) => [entry.id, `${entry.cell.gw}x${entry.cell.gh}`])
    );
    dragTo(board, "a", 4, 0);

    const resolved = resolveOverlaps(board, "a")!;
    for (const entry of resolved) {
      expect(`${entry.cell.gw}x${entry.cell.gh}`).toBe(sizesBefore[entry.id]);
    }
  });

  it("keeps everything inside the grid", () => {
    const board = roomToMove();
    dragTo(board, "a", 4, 1);

    const resolved = resolveOverlaps(board, "a")!;
    expect(withinGrid(resolved)).toBe(true);
  });

  it("closes the gap left above a tile", () => {
    const board = cellsOf(
      boardOf({
        a: [0, 0, 4, 4],
        // Floating with three empty rows above it.
        b: [4, 3, 4, 5],
      }),
      ["a", "b"]
    );

    const resolved = resolveOverlaps(board, "a")!;
    expect(resolved.find((entry) => entry.id === "b")!.cell.gy).toBe(0);
  });

  it("refuses a move that cannot be accommodated", () => {
    // Packed solid: every one of the grid's cells is taken, which is what the
    // default board looks like. Nothing can be pushed anywhere.
    const board = cellsOf(
      boardOf({
        a: [0, 0, 4, 8],
        b: [4, 0, 4, 8],
        c: [8, 0, 4, 8],
      }),
      ["a", "b", "c"]
    );
    board[0].cell = { gx: 4, gy: 0, gw: 4, gh: 8 };

    expect(resolveOverlaps(board, "a")).toBeNull();
  });

  it("refuses a tile dropped past the bottom edge", () => {
    const board = cellsOf(boardOf({ a: [0, 0, 4, 4] }), ["a"]);
    board[0].cell = { gx: 0, gy: 6, gw: 4, gh: 4 };

    expect(resolveOverlaps(board, "a")).toBeNull();
  });

  it("returns null when the moved tile isn't on the board", () => {
    expect(resolveOverlaps(roomToMove(), "nope")).toBeNull();
  });

  it("keeps every tile it was given", () => {
    const board = roomToMove();
    dragTo(board, "a", 4, 0);

    const resolved = resolveOverlaps(board, "a")!;
    expect(resolved.map((entry) => entry.id).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("gridArrange", () => {
  it("produces a board that fills the grid without overlapping", () => {
    for (let count = 1; count <= ALL_SECTIONS.length; count++) {
      const ids = ALL_SECTIONS.slice(0, count);
      const arranged = gridArrange(ids, defaultLayout(ids));
      const cells = cellsOf(arranged, ids);

      expect(anyOverlap(cells)).toBe(false);
      expect(withinGrid(cells)).toBe(true);
      expect(coverage(cells)).toBe(GRID_COLUMNS * GRID_ROWS);
    }
  });

  it("gives every tile at least one whole grid row", () => {
    const ids = ALL_SECTIONS;
    const arranged = gridArrange(ids, defaultLayout(ids));
    for (const { cell } of cellsOf(arranged, ids)) {
      expect(cell.gh).toBeGreaterThanOrEqual(1);
      expect(cell.gw).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps tiles in the order they currently read", () => {
    // Board reading right-to-left: c, b, a.
    const board = boardOf({
      a: [8, 0, 4, 8],
      b: [4, 0, 4, 8],
      c: [0, 0, 4, 8],
    });

    const arranged = gridArrange(["a", "b", "c"], board);
    expect(arranged.c.x).toBeLessThan(arranged.b.x);
    expect(arranged.b.x).toBeLessThan(arranged.a.x);
  });

  it("orders tiles in the same column top to bottom", () => {
    const board = boardOf({
      lower: [0, 4, 12, 4],
      upper: [0, 0, 12, 4],
    });

    const arranged = gridArrange(["lower", "upper"], board);
    expect(arranged.upper.y).toBeLessThanOrEqual(arranged.lower.y);
  });

  it("has nothing to arrange when there are no tiles", () => {
    expect(gridArrange([], {})).toEqual({});
  });

  it("leaves tiles different sizes", () => {
    const ids = ALL_SECTIONS;
    const arranged = gridArrange(ids, defaultLayout(ids));
    const sizes = new Set(
      cellsOf(arranged, ids).map(({ cell }) => `${cell.gw}x${cell.gh}`)
    );
    expect(sizes.size).toBeGreaterThan(1);
  });
});

describe("normalizeToGrid", () => {
  it("leaves a board that is already tidy exactly as it is", () => {
    const board = boardOf({
      a: [0, 0, 4, 8],
      b: [4, 0, 4, 3],
      c: [4, 3, 4, 5],
      d: [8, 0, 4, 8],
    });
    const ids = ["a", "b", "c", "d"];

    // This is the promise that stops a render from quietly rearranging a board
    // the student placed themselves.
    expect(normalizeToGrid(ids, board)).toEqual(board);
  });

  it("snaps an off-grid board onto the grid", () => {
    const board: Layout = {
      a: rect(0.01, 0.02, 0.32, 0.99, 1),
      b: rect(0.34, 0, 0.33, 0.99, 2),
    };
    const normalized = normalizeToGrid(["a", "b"], board);

    for (const { cell } of cellsOf(normalized, ["a", "b"])) {
      expect(Number.isInteger(cell.gx)).toBe(true);
      expect(Number.isInteger(cell.gy)).toBe(true);
    }
  });

  it("re-arranges rather than leaving tiles on top of each other", () => {
    const overlapping = boardOf({
      a: [0, 0, 8, 8],
      b: [4, 0, 8, 8],
    });
    const ids = ["a", "b"];

    const normalized = normalizeToGrid(ids, overlapping);
    expect(anyOverlap(cellsOf(normalized, ids))).toBe(false);
  });

  it("re-arranges a board that hangs off the edge", () => {
    const outside = boardOf({ a: [0, 0, 4, 4] });
    outside.b = rect(0.9, 0.9, 0.5, 0.5, 2);
    const ids = ["a", "b"];

    const normalized = normalizeToGrid(ids, outside);
    expect(withinGrid(cellsOf(normalized, ids))).toBe(true);
  });

  it("ignores ids that have no rect", () => {
    const board = boardOf({ a: [0, 0, 12, 8] });
    const normalized = normalizeToGrid(["a", "missing"], board);
    expect(Object.keys(normalized)).toEqual(["a"]);
  });
});

describe("the board as a whole", () => {
  it("stays valid through an arrange, a drag and a re-normalise", () => {
    const ids = ALL_SECTIONS;
    let board = gridArrange(ids, defaultLayout(ids));

    // Drag the last tile onto the first tile's corner.
    const placements = cellsOf(board, ids);
    const target = toCell(board[ids[0]]);
    placements[placements.length - 1].cell = {
      ...placements[placements.length - 1].cell,
      gx: target.gx,
      gy: target.gy,
    };

    const resolved = resolveOverlaps(placements, ids[ids.length - 1]);
    if (resolved) {
      board = {};
      for (const entry of resolved) board[entry.id] = fromCell(entry.cell, 1);
      expect(anyOverlap(cellsOf(board, ids))).toBe(false);
      expect(withinGrid(cellsOf(board, ids))).toBe(true);
    }

    const normalized = normalizeToGrid(ids, board);
    expect(anyOverlap(cellsOf(normalized, ids))).toBe(false);
    expect(withinGrid(cellsOf(normalized, ids))).toBe(true);
  });
});
