/**
 * Guide ordering within a module.
 *
 * Dependency-free so the route that saves a guide and its tests can share it.
 */

export type OrderedGuide = { id: string; order: number };

/**
 * Which other guides in a module move, and where to, when one guide takes an
 * order number another guide already has.
 *
 * The edited guide is not in `others`. `from` is its current number in this
 * module, or null when it is arriving from another module.
 *
 * Moving 2 -> 6 among 3,4,5,6,7,8 gives 3,4,5,6 -> 2,3,4,5: everything between
 * the old and new number slides one step toward the old number, and 7 and 8
 * stay put. Moving up is the mirror image. A guide arriving from another
 * module pushes the target and everything after it one step down.
 *
 * Nothing moves when the number is unchanged or when no other guide has it:
 * a gap is a valid place to land, and hand-imported guides have plenty.
 */
export function planOrderShift(
  others: OrderedGuide[],
  from: number | null,
  to: number
): OrderedGuide[] {
  if (from === to) return [];
  if (!others.some((guide) => guide.order === to)) return [];

  const moved: OrderedGuide[] = [];
  for (const guide of others) {
    if (from === null) {
      if (guide.order >= to) moved.push({ id: guide.id, order: guide.order + 1 });
    } else if (to > from) {
      if (guide.order > from && guide.order <= to) {
        moved.push({ id: guide.id, order: guide.order - 1 });
      }
    } else if (guide.order >= to && guide.order < from) {
      moved.push({ id: guide.id, order: guide.order + 1 });
    }
  }
  return moved;
}
