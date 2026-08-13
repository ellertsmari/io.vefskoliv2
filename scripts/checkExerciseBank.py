#!/usr/bin/env python3
"""Check an auto-graded guide's question bank.

Enforces the mechanics in docs/exercise-authoring.md, flags duplicates and thin
coverage, and — for the things no script can judge — prints the questions that
need a human to read them, with the specific reason.

It deliberately does NOT try to decide whether a question is good. What it does
instead is refuse to let the thinking go unrecorded: a wrong option without a
note, or a note generic enough to paste onto any question, is reported, because
the note is the only evidence that the misconception was considered at all.

Usage:
    python3 scripts/checkExerciseBank.py [--guide "TypeScript Introduction"]
                                         [--file dbBackup/Hopur11.guides.json]
                                         [--check-links]
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher

RED, YELLOW, GREEN, DIM, RESET = (
    "\033[31m", "\033[33m", "\033[32m", "\033[2m", "\033[0m"
)

problems: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    problems.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def normalise(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", (text or "").lower()).strip()


def check_structure(tasks: list[dict]) -> None:
    """§5 — the mechanics. Any of these breaks grading outright."""
    seen_ids = set()
    for i, t in enumerate(tasks):
        where = f"task {i + 1} ({(t.get('prompt') or '')[:45]}…)"

        oid = (t.get("_id") or {}).get("$oid") if isinstance(t.get("_id"), dict) else t.get("_id")
        if not oid:
            fail(f"{where}: no _id. Nothing generates one on import — every task "
                 f"would share the id \"\", breaking answer keying and grading.")
        elif oid in seen_ids:
            fail(f"{where}: duplicate _id {oid}")
        else:
            seen_ids.add(oid)

        if not (t.get("prompt") or "").strip():
            fail(f"{where}: no prompt")
        if not t.get("goal"):
            warn(f"{where}: no knowledge goal — it cannot appear in per-goal feedback")

        if t["type"] == "quiz":
            options = t.get("options") or []
            correct = t.get("correctAnswers") or []
            if len(options) < 2:
                fail(f"{where}: fewer than two options")
            if not correct:
                fail(f"{where}: no correct answer marked")
            for c in correct:
                if not 0 <= c < len(options):
                    fail(f"{where}: correctAnswers index {c} is outside the options")
            if not t.get("allowMultiple") and len(correct) != 1:
                fail(f"{where}: single-choice question with {len(correct)} correct answers")

        if t["type"] == "shortAnswer" and not (t.get("acceptedAnswers") or t.get("pattern")):
            fail(f"{where}: no accepted answers and no pattern")

        if t["type"] == "code":
            tests = t.get("tests") or []
            if not t.get("entryPoint"):
                fail(f"{where}: no entryPoint")
            if len(tests) < 3:
                warn(f"{where}: only {len(tests)} test cases")
            if not any(c.get("hidden") for c in tests):
                fail(f"{where}: no hidden test — a hardcoded answer would pass")
            if not (t.get("starterCode") or "").strip():
                warn(f"{where}: no starter code")


def check_option_notes(tasks: list[dict]) -> None:
    """§1 — every wrong option must say why, in its own terms."""
    all_notes: dict[str, list[str]] = defaultdict(list)

    for i, t in enumerate(tasks):
        if t["type"] != "quiz":
            continue
        where = f"task {i + 1} ({(t.get('prompt') or '')[:45]}…)"
        options = t.get("options") or []
        correct = set(t.get("correctAnswers") or [])
        notes = t.get("optionFeedback")

        if not notes:
            fail(f"{where}: no optionFeedback. A wrong answer would get only the "
                 f"generic hint, which explains the question rather than the "
                 f"student's actual choice.")
            continue
        if len(notes) != len(options):
            fail(f"{where}: optionFeedback has {len(notes)} entries for "
                 f"{len(options)} options — they are positional, so they are misaligned")
            continue

        for j, note in enumerate(notes):
            if j in correct:
                if note:
                    fail(f"{where}: option {j + 1} is CORRECT but carries a note — "
                         f"that tells the student which one it is")
                continue
            if not (note or "").strip():
                fail(f"{where}: wrong option {j + 1} (\"{options[j][:40]}\") has no note")
            else:
                all_notes[normalise(note)].append(f"{where} option {j + 1}")
                if len(note.strip()) < 40:
                    warn(f"{where}: note on option {j + 1} is very short — does it name "
                         f"the misconception, or just say 'wrong'?")

    for note, places in all_notes.items():
        if len(places) > 1:
            fail("the same note is used in several places, so it cannot be about any "
                 "one option: " + "; ".join(places))


def check_answer_notes(tasks: list[dict]) -> None:
    """Short answers: anticipated wrong answers, and none that contradict."""
    for i, t in enumerate(tasks):
        if t["type"] != "shortAnswer":
            continue
        where = f"task {i + 1} ({(t.get('prompt') or '')[:45]}…)"
        feedback = t.get("answerFeedback") or []

        # Ambiguity cannot be detected, but the phrasings that produce it can
        # be. A short answer has to have ONE answer; these ask for a judgement,
        # which a marker matching exact strings cannot grade.
        # Narrow on purpose. The distinction is not the phrase but whether the
        # answer is a TERM: "what should the annotation be" has one answer,
        # while "what should you check" asks the reader what to do, which has
        # several defensible ones. Only the second shape is flagged.
        open_ended = [
            "first thing", "why ", "how would you", "how do you",
            "what should you", "what would you", "explain", "describe ",
            "in your own words",
        ]
        prompt = (t.get("prompt") or "").lower()
        for phrase in open_ended:
            if phrase in prompt:
                warn(f"{where}: the wording {phrase.strip()!r} asks for a judgement "
                     f"rather than a term. A reasonable answer that is not on the "
                     f"accepted list will be marked wrong — make it a quiz question.")
                break

        if not feedback:
            warn(f"{where}: no answerFeedback. A wrong answer gets only the generic "
                 f"hint, which explains the question rather than what they typed.")
            continue

        accepted = {normalise_answer(a) for a in (t.get("acceptedAnswers") or [])}
        for entry in feedback:
            if not (entry.get("note") or "").strip():
                fail(f"{where}: an answerFeedback entry has no note")
            if not entry.get("match") and not entry.get("pattern"):
                fail(f"{where}: an answerFeedback entry matches nothing "
                     f"(no `match`, no `pattern`)")
            match = entry.get("match")
            if match and normalise_answer(match) in accepted:
                fail(f"{where}: answerFeedback explains why {match!r} is wrong, but it "
                     f"is in acceptedAnswers — a student who gets it RIGHT would be "
                     f"told why they are wrong")


def normalise_answer(text: str) -> str:
    """Mirrors normalizeAnswer in app/utils/shortAnswer.ts."""
    out = re.sub(r"\s+", " ", (text or "").strip().lower())
    return re.sub(r"[.,;:!?]+$", "", out).strip()


STOPWORDS = {
    "a", "an", "the", "of", "in", "is", "are", "to", "and", "or", "what", "which",
    "these", "this", "that", "it", "you", "your", "does", "do", "for", "with",
    "when", "how", "write", "function", "returns", "return", "given", "each",
    "javascript", "typescript", "at", "on", "be", "as", "so", "from", "by",
}


def content_words(text: str) -> set[str]:
    return {w for w in normalise(text).split() if w not in STOPWORDS and len(w) > 2}


def check_duplicates(tasks: list[dict]) -> None:
    """§4 — the same question twice in different words.

    Compares the words that carry meaning rather than the whole sentence:
    "Which of these run JavaScript?" and "Which of these are falsy in
    JavaScript?" are 84% identical as strings and about entirely different
    things. A detector that cries wolf gets ignored.
    """
    prompts = [(i, normalise(t.get("prompt") or ""), content_words(t.get("prompt") or ""))
               for i, t in enumerate(tasks)]
    for a in range(len(prompts)):
        for b in range(a + 1, len(prompts)):
            words_a, words_b = prompts[a][2], prompts[b][2]
            if not words_a or not words_b:
                continue
            overlap = len(words_a & words_b) / len(words_a | words_b)
            ratio = SequenceMatcher(None, prompts[a][1], prompts[b][1]).ratio()
            if overlap > 0.6 and ratio > 0.6:
                warn(f"tasks {prompts[a][0] + 1} and {prompts[b][0] + 1} read "
                     f"{ratio:.0%} alike — the same question twice?\n"
                     f"      1: {tasks[prompts[a][0]]['prompt'][:70]}\n"
                     f"      2: {tasks[prompts[b][0]]['prompt'][:70]}")


def check_coverage(guide: dict, tasks: list[dict]) -> None:
    """§3 — every goal assessed, and a mix of what the questions demand.

    Skills count as goals too: "be able to write a function" is exactly the kind
    of objective a question should be tagged to, and tagging only knowledge
    items would leave half the guide's promises unassessed.
    """
    goals = [k["knowledge"] if isinstance(k, dict) else k for k in guide.get("knowledge", [])]
    goals += [s["skill"] if isinstance(s, dict) else s for s in guide.get("skills", [])]
    tagged = Counter(t.get("goal") for t in tasks if t.get("goal"))

    for goal in goals:
        n = tagged.get(goal, 0)
        if n == 0:
            fail(f"knowledge goal never assessed: \"{goal[:60]}\"")
        elif n < 3:
            warn(f"only {n} question(s) for goal \"{goal[:55]}\" — a pooled draw may "
                 f"leave it unassessed")

    for goal in tagged:
        if goal not in goals:
            warn(f"question tagged with a goal that is not on the guide: \"{goal[:60]}\"")


def check_pools(exercise: dict, tasks: list[dict]) -> None:
    """Pool sanity, and how much two students will actually have in common."""
    counts = Counter(t["type"] for t in tasks)
    pools = exercise.get("poolSizes") or {}
    print(f"\n  bank: {dict(counts)}")
    print(f"  served per attempt: {pools or 'everything'}")

    for kind, served in pools.items():
        have = counts.get(kind, 0)
        if served >= have:
            fail(f"{kind} pool serves {served} of {have} — not smaller than the bank, "
                 f"so nothing is pooled and every student gets the same set")
            continue
        overlap = served * served / have
        note = GREEN if overlap <= 3 else YELLOW if overlap <= 5 else RED
        print(f"    {kind}: two students share {note}{overlap:.1f} of {served}{RESET}")
        if overlap > 5:
            warn(f"{kind}: students share most of their questions. "
                 f"Bank of {have} serving {served} — more questions is the only fix.")


def check_links(tasks: list[dict], verify: bool) -> None:
    missing = [i + 1 for i, t in enumerate(tasks) if not (t.get("helpLinks") or [])]
    if missing:
        warn(f"tasks with no helpLinks: {missing}")
    if not verify:
        return
    import urllib.request

    urls = {l["url"] for t in tasks for l in (t.get("helpLinks") or [])}
    print(f"\n  checking {len(urls)} links…")
    for url in sorted(urls):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as res:
                if res.status != 200:
                    fail(f"link returned {res.status}: {url}")
        except Exception as e:  # noqa: BLE001 - any failure is a failure
            fail(f"link unreachable ({e}): {url}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default="dbBackup/Hopur11.guides.json")
    ap.add_argument("--guide", default="TypeScript Introduction")
    ap.add_argument("--check-links", action="store_true")
    args = ap.parse_args()

    try:
        with open(args.file, encoding="utf-8") as fh:
            guides = json.load(fh)
    except FileNotFoundError:
        print(f"{RED}{args.file} not found.{RESET} The guide collection is gitignored; "
              f"export it from Compass first.")
        return 1

    matches = [g for g in guides if (g.get("title") or "").startswith(args.guide)]
    if not matches:
        print(f"{RED}No guide starting with {args.guide!r}{RESET}")
        return 1
    guide = matches[0]
    exercise = guide.get("exercise") or {}
    tasks = exercise.get("tasks") or []

    print(f"\n{guide['title']} — {len(tasks)} tasks")

    check_structure(tasks)
    check_option_notes(tasks)
    check_answer_notes(tasks)
    check_duplicates(tasks)
    check_coverage(guide, tasks)
    check_pools(exercise, tasks)
    check_links(tasks, args.check_links)

    print()
    for w in warnings:
        print(f"  {YELLOW}warn{RESET}  {w}")
    for p in problems:
        print(f"  {RED}FAIL{RESET}  {p}")

    print(f"\n  {len(problems)} problem(s), {len(warnings)} warning(s)")

    # The part no checker can do.
    print(f"""
{DIM}Checked: ids, answer keys, option notes, duplicates by wording, coverage,
pool sizes, links. NOT checked, because a script cannot:{RESET}

  1. Does each wrong option encode a misconception a student might actually
     hold — or is it filler nobody would pick?
  2. Can any question be answered by string-matching the guide instead of
     understanding it?
  3. Do two questions test the same idea in different words? (Only wording is
     compared above.)
  4. Is the mix right — recall, application and diagnosis, not all recall?

{DIM}See docs/exercise-authoring.md §1-§4. Read the option notes: they are the
evidence that §1 happened.{RESET}
""")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
