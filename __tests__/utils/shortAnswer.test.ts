import {
  matchShortAnswer,
  normalizeAnswer,
  editDistance,
  nearMissThreshold,
  MAX_ANSWER_LENGTH,
} from "utils/shortAnswer";

describe("normalizeAnswer", () => {
  it("ignores case, surrounding whitespace and trailing punctuation", () => {
    expect(normalizeAnswer("  Const. ")).toBe("const");
    expect(normalizeAnswer("CONST")).toBe("const");
    expect(normalizeAnswer("const!!")).toBe("const");
  });

  it("collapses internal whitespace runs", () => {
    expect(normalizeAnswer("template   literal")).toBe("template literal");
    expect(normalizeAnswer("template\tliteral")).toBe("template literal");
  });

  it("keeps punctuation that is not trailing", () => {
    expect(normalizeAnswer("array.length")).toBe("array.length");
  });

  it("caps absurdly long input", () => {
    expect(normalizeAnswer("a".repeat(5000))).toHaveLength(MAX_ANSWER_LENGTH);
  });
});

describe("editDistance", () => {
  it("is zero for identical strings", () => {
    expect(editDistance("const", "const", 2)).toBe(0);
  });

  it("counts single edits", () => {
    expect(editDistance("const", "konst", 2)).toBe(1); // substitution
    expect(editDistance("const", "cons", 2)).toBe(1); // deletion
    expect(editDistance("const", "consts", 2)).toBe(1); // insertion
  });

  it("gives up past the ceiling rather than computing the true distance", () => {
    expect(editDistance("const", "completely different", 2)).toBeGreaterThan(2);
  });
});

describe("nearMissThreshold", () => {
  it("allows no slack on very short answers, where one edit is a different answer", () => {
    expect(nearMissThreshold("3")).toBe(0);
    expect(nearMissThreshold("let")).toBe(0);
  });

  it("scales with length", () => {
    expect(nearMissThreshold("const")).toBe(1);
    expect(nearMissThreshold("template literal")).toBe(2);
  });
});

describe("matchShortAnswer", () => {
  const key = { acceptedAnswers: ["const", "a constant"] };

  it("accepts an exact answer", () => {
    expect(matchShortAnswer(key, "const").status).toBe("correct");
  });

  it("accepts an answer that differs only in case, spacing or trailing punctuation", () => {
    expect(matchShortAnswer(key, "  CONST. ").status).toBe("correct");
    expect(matchShortAnswer(key, "a  constant").status).toBe("correct");
  });

  it("holds a typo for review rather than marking it wrong", () => {
    const result = matchShortAnswer(key, "konst");
    expect(result.status).toBe("pending");
    expect(result.matched).toBe("const");
  });

  it("marks a genuinely different answer wrong", () => {
    expect(matchShortAnswer(key, "let").status).toBe("incorrect");
    expect(matchShortAnswer(key, "a function").status).toBe("incorrect");
  });

  it("does not hold a near miss on a very short answer", () => {
    // "4" is one edit from "3" but is simply the wrong number.
    expect(matchShortAnswer({ acceptedAnswers: ["3"] }, "4").status).toBe(
      "incorrect"
    );
  });

  it("treats a blank or non-string answer as wrong, never pending", () => {
    expect(matchShortAnswer(key, "").status).toBe("incorrect");
    expect(matchShortAnswer(key, "   ").status).toBe("incorrect");
    expect(matchShortAnswer(key, undefined).status).toBe("incorrect");
    expect(matchShortAnswer(key, [0, 1]).status).toBe("incorrect");
  });

  it("accepts anything the pattern matches, for answers with real variation", () => {
    const numeric = { acceptedAnswers: [], pattern: "^\\d+\\s*(px)?$" };
    expect(matchShortAnswer(numeric, "16px").status).toBe("correct");
    expect(matchShortAnswer(numeric, "16").status).toBe("correct");
    expect(matchShortAnswer(numeric, "sixteen").status).toBe("incorrect");
  });

  it("ignores an invalid pattern instead of breaking the exercise", () => {
    const broken = { acceptedAnswers: ["const"], pattern: "([unclosed" };
    expect(matchShortAnswer(broken, "const").status).toBe("correct");
    expect(matchShortAnswer(broken, "nonsense").status).toBe("incorrect");
  });

  it("prefers an exact match over holding it as a near miss", () => {
    // "let" is within one edit of "lets", but it is also exactly accepted.
    const both = { acceptedAnswers: ["lets", "let"] };
    expect(matchShortAnswer(both, "let").status).toBe("correct");
  });
});
