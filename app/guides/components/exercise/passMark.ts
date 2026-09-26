/**
 * The pass mark on the 0..10 scale students see their score on.
 *
 * Stored as a fraction of the points (0.7), but a student reads "6.4/10" next
 * to it, so it has to be said in the same units — "70%" beside "6.4/10" still
 * leaves them to do the conversion, and "not passed" beside a 6.4 looks wrong
 * to anyone used to 5 being a pass.
 */
export const passMark = (passThreshold: number): string =>
  `${Math.round(passThreshold * 100) / 10}/10`;

const FRACTIONS: Record<string, string> = {
  "0.5": "½",
  "0.25": "¼",
  "0.75": "¾",
  "0.125": "⅛",
};

/**
 * What a question is worth, as a student reads it: "1 point", "½ point",
 * "1½ points". Halving produces ½, ¼, ⅛ — written as fractions, because
 * "0.125 points" says the same thing far less plainly. Past that, decimals.
 */
export const formatPoints = (points: number): string => {
  const whole = Math.floor(points);
  const fraction = Math.round((points - whole) * 1000) / 1000;
  const glyph = fraction === 0 ? "" : FRACTIONS[String(fraction)];

  if (glyph === undefined) {
    return `${Math.round(points * 100) / 100} points`;
  }
  const text = `${whole > 0 || !glyph ? whole : ""}${glyph}`;
  return `${text} ${points <= 1 && points > 0 ? "point" : "points"}`;
};
