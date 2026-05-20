/**
 * Module-number helpers.
 *
 * Lives in its own dependency-free file (no model/mongoose imports) so it can be
 * safely imported by both server code and client components.
 *
 * IMPORTANT: a module's number must be parsed from the FULL leading integer of
 * its title (e.g. "10 - Advanced topics" -> 10), not from the first character.
 * Reading `title[0]` collapses every double-digit module onto a single-digit one
 * ("10" -> "1"), which silently corrupts per-module grouping such as grade
 * averages. The DB `module.number` field is unreliable (often undefined), so the
 * title is the source of truth. Always use this helper instead of `title[0]`.
 */
export const extractModuleNumber = (title: string): number => {
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
